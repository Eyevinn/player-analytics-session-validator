import { ALBResult, ALBEvent } from 'aws-lambda';
import Logger from '../logging/logger';
import { EventDB } from '../lib/EventDB';
import Validator from '../lib/Validator';
import {
  responseHeaders,
  generateResponseStatus,
  generateValidResponseBody,
  generateInvalidResponseBody,
} from '../lib/route-helpers';

export const handler = async (event: ALBEvent): Promise<ALBResult> => {
  const m = event.path.match(/\/session\/(\S+)/);
  const validator = new Validator(Logger);
  if (event.httpMethod === 'GET' && m) {
    const requestSessionId = m[1];
    const response = {
      statusCode: 200,
      statusDescription: 'OK',
      headers: responseHeaders,
      body: '{}',
    };
    const eventDB = new EventDB(Logger);
    let eventsListRaw = await eventDB.getEvents(requestSessionId);
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
      response.body = JSON.stringify(generateValidResponseBody(requestSessionId, simpleEventsList, validationResult));
    } else {
      response.body = JSON.stringify(generateInvalidResponseBody(requestSessionId));
    }
    return response as ALBResult;
  }
  // If wrong path, respond with 404. If unsupported method, respond with method not allowed. Otherwise bad access.
  const { statusCode, statusDescription } = generateResponseStatus({
    path: event.path,
    method: event.httpMethod,
  });
  const response = {
    statusCode,
    statusDescription,
    headers: responseHeaders,
    body: `{"message": ${statusDescription}}`,
  };
  return response as ALBResult;
};
