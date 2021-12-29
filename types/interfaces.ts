export interface responseBody {
  sessionId: string;
  message?: string;
  Events?: any[],
}

export type validatorResponse = {
  statusCode: number,
  statusDescription: string,
  headers: Record<string, any>,
  body: responseBody,
}
