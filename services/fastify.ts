import Logger from '../logging/logger';
import { EventDB } from '../lib/EventDB';
import Validator from '../lib/Validator';
import {
  responseHeaders,
  generateResponseStatus,
  generateValidResponseBody,
  generateInvalidResponseBody,
} from '../lib/route-helpers';

const fastify = require('fastify')();

fastify.get('/session/:sessionId', async (request, reply) => {
  const sessionId = request.params.sessionId;
  if (!sessionId) {
    reply.status(400).headers(responseHeaders).send({ message: 'Bad request' });
    return;
  }
  const validator = new Validator(Logger);
  const eventDB = new EventDB(Logger);
  // (dev): To read from different table, enter your table of choice as the 2nd argument of .getEvents()
  const eventsListRaw = await eventDB.getEvents(sessionId, `epas_${request.headers['host']}`);
  let responseBody;
  if (eventsListRaw) {
    eventsListRaw.sort((a, b) => a.timestamp - b.timestamp);
    // remove overhead data from event objects
    const simpleEventsList = eventsListRaw.map((eventObj) => ({
      event: eventObj.event,
      sessionId: eventObj.sessionId,
      timestamp: eventObj.timestamp,
      playhead: eventObj.playhead,
      duration: eventObj.duration,
    }));
    const validationResult = validator.validateEventOrder(simpleEventsList);
    responseBody = generateValidResponseBody(sessionId, simpleEventsList, validationResult);
  } else {
    responseBody = generateInvalidResponseBody(sessionId);
  }
  reply.status(200).headers(responseHeaders).send(responseBody);
});

/**
 * This will catch every other requests coming in and respond with an applicable response status code.
 */
fastify.route({
  method: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT', 'DELETE'],
  url: '/*',
  handler: (request, reply) => {
    const { statusCode, statusDescription } = generateResponseStatus({ path: request.url, method: request.method });
    reply.status(statusCode).headers(responseHeaders).send(statusDescription);
  },
});

const start = async () => {
  try {
    await fastify.listen(3001);
    Logger.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    Logger.error('Error starting server', err);
    process.exit(1);
  }
};
start();
