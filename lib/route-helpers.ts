import { TPlayerAnalyticsEvent } from '@eyevinn/player-analytics-specification';
import { InvalidResponseBody, ValidResponseBody } from '../types/interfaces';
import { ValidatorOutput } from './Validator';

export const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export function generateResponseStatus({ path, method }: { path: string; method: string }): {
  statusCode: number;
  statusDescription: string;
} {
  const statusCode = path !== '/session' ? 404 : method !== 'GET' ? 405 : 400;
  const statusDescription = path !== '/session' ? 'Not Found' : method !== 'GET' ? 'Method Not Allowed' : 'Bad Request';
  return {
    statusCode,
    statusDescription,
  };
}

export function generateValidResponseBody(
  requestSessionId: string,
  eventsList: TPlayerAnalyticsEvent[],
  validationResult: ValidatorOutput
): ValidResponseBody {
  const reply: ValidResponseBody = {
    sessionId: requestSessionId,
    Events: eventsList,
    valid: validationResult.valid,
  };
  if (validationResult.message) {
    reply['message'] = validationResult.message;
  }
  if (validationResult.invalidEventIndex) {
    reply['invalidEventIndex'] = validationResult.invalidEventIndex;
  }

  return reply;
}

export function generateInvalidResponseBody(requestSessionId: string): InvalidResponseBody {
  return {
    sessionId: requestSessionId,
    message: 'Failed getting Events from DB',
  };
}
