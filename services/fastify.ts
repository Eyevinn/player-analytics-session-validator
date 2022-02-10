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

fastify.get("/session/:sessionId", async (request, reply) => {
  const sessionId = request.params.sessionId;
  if (!sessionId) {
    reply
      .status(400)
      .headers(responseHeaders)
      .send({ message: "Bad request" });
    return;
  }
  const validator = new Validator(Logger);
  const eventDB = new EventDB(Logger);
  const eventsList = await eventDB.getEvents(
    sessionId,
    `epas_${request.headers['host']}`
  );
  let responseBody;
  if (eventsList) {
    eventsList.sort((a, b) => a.timestamp - b.timestamp);
    const validationResult = validator.validateEventOrder(eventsList);
    responseBody = generateValidResponseBody(validationResult, sessionId);
  } else {
    responseBody = generateInvalidResponseBody(sessionId);
  }
  reply
    .status(200)
    .headers(responseHeaders)
    .send(responseBody);
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
    Logger.error("Error starting server", err);
    process.exit(1);
  }
}
start();
