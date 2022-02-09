import { responseBody } from '../types/interfaces';

export const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export function generateResponseStatus({
  path,
  method,
}: {
  path: string;
  method: string;
}): { statusCode: number; statusDescription: string } {
  const statusCode = path !== '/session' ? 404 : method !== 'GET' ? 405 : 400;
  const statusDescription =
    path !== '/session'
      ? 'Not Found'
      : method !== 'GET'
      ? 'Method Not Allowed'
      : 'Bad Request';
  return {
    statusCode,
    statusDescription,
  };
}

export function generateValidResponseBody(eventsList: any[], requestSessionId: string): responseBody {
  return {
    sessionId: requestSessionId,
    Events: eventsList,
  };
}

export function generateInvalidResponseBody(requestSessionId: string): responseBody {
  return {
    sessionId: requestSessionId,
    message: 'Cannot get events from DB',
  }
}
