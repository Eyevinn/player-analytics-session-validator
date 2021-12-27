import { ALBResult, ALBEvent } from 'aws-lambda';
import Logger from './logging/logger';
import { EventDB } from './lib/EventDB';
import Validator from './lib/Validator';

export const handler = async (event: ALBEvent): Promise<ALBResult> => {
  const m = event.path.match(/\/session\/(\S+)/);
  const validator = new Validator(Logger);
  if (event.httpMethod === 'GET' && m) {
    let validationResult = {};
    const requestSessionId = m[1];
    let requestHost: string = 'unknown';
    if (event.headers && event.headers['host']) {
      requestHost = event.headers['host'];
    }
    let eventDB = new EventDB(Logger);
    let eventsList: any[] = await eventDB.getEvents(
      requestSessionId,
      `epas_${requestHost}`
    );
    eventsList.sort((a, b) => a.timestamp - b.timestamp);
    validationResult = validator.validResponse(eventsList);
    validationResult['body'] = JSON.stringify(validationResult['body']);
    return validationResult as ALBResult;
  } else {
    const resp = validator.validResponse();
    resp.body = '{}';
    return resp as ALBResult;
  }
};
