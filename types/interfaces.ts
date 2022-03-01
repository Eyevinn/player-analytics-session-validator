import { TPlayerAnalyticsEvent } from '@eyevinn/player-analytics-specification';

export type ValidResponseBody = {
  sessionId: string,
  Events: TPlayerAnalyticsEvent[],
  valid: boolean,
  message?: string,
  invalidEventIndex?: number
};

export type InvalidResponseBody = {
  sessionId: string,
  message?: string
};

export type ValidatorResponse = {
  statusCode: number;
  statusDescription: string;
  headers: Record<string, any>;
  body: ValidResponseBody;
};
