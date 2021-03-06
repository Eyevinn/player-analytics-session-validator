import winston from 'winston';
import { TPlayerAnalyticsEvent, TBaseEvent } from '@eyevinn/player-analytics-specification';

export type ValidatedEvent = TBaseEvent & {
  event: string;
};

export type ValidatorOutput = {
  valid: boolean;
  message?: string;
  invalidEventIndex?: number;
};

export type PAEventItem = {
  index: number;
  PAEvent: TPlayerAnalyticsEvent;
};

export enum PlayPauseStatus {
  'NONE',
  'PLAYING',
  'PAUSED',
}

const generateErrorMessage = (msg: string) => {
  return 'Faulty event sequence: ' + msg;
};

export default class Validator {
  logger: winston.Logger;
  events: any;
  singleAppearanceEvents: {};
  output: ValidatorOutput;
  prevPlayPauseStatus: PlayPauseStatus;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.prevPlayPauseStatus = PlayPauseStatus.NONE;
    // Event name : current appearences count
    this.singleAppearanceEvents = {
      init: 0,
      loading: 0,
      loaded: 0,
      error: 0,
      stopped: 0,
    };
    this.events = {
      // Event name : Non-allowed follow up event(s)
      init: ['loaded', 'seeked', 'seeking', 'buffered', 'buffering', 'bitrate_changed', 'init', 'playing', 'paused'],
      heartbeat: ['init'],
      metadata: [],
      warning: ['init'],
      stopped: [
        'init',
        'heartbeat',
        'loading',
        'loaded',
        'buffered',
        'buffering',
        'seeked',
        'bitrate_changed',
        'stopped',
        'paused',
        'warning',
        'error',
      ],
      error: [
        'init',
        'loading',
        'loaded',
        'playing',
        'paused',
        'buffering',
        'buffered',
        'warning',
        'seeking',
        'seeked',
        'bitrate_changed',
      ],
      loading: [
        'init',
        'seeked',
        'seeking',
        'buffered',
        'buffering',
        'loading',
        'playing',
        'paused',
        'bitrate_changed',
      ],
      loaded: ['init', 'loading', 'seeked', 'buffered', 'loaded', 'paused'],
      playing: ['init', 'loading', 'loaded', 'buffered', 'seeked', 'playing'],
      paused: ['init', 'loading', 'loaded', 'paused'],
      buffering: ['init', 'loading', 'loaded', 'seeked', 'playing', 'buffering'],
      buffered: ['init', 'loading', 'loaded', 'seeked', 'buffered'],
      seeking: ['init', 'loading', 'loaded', 'seeking', 'buffered', 'buffering', 'playing'],
      seeked: ['init', 'loading', 'loaded', 'buffered', 'seeked'],
      bitrate_changed: ['init', 'loading', 'loaded', 'buffered', 'bitrate_changed'],
    };
  }

  /**
   *
   * @param eventsList list of sorted events
   * @returns list of validated events
   */
  validateEventOrder(eventsList: TPlayerAnalyticsEvent[]): ValidatorOutput {
    let output: ValidatorOutput = {
      valid: true,
    };
    if (!eventsList || eventsList.length === 0) {
      return { valid: true };
    }
    this.logger.debug(`Number of events: ${eventsList.length}`);
    // Filter out all 'metadata' events.
    // Necessary since 'metadata' is a wildcard
    const filteredEvents: PAEventItem[] = eventsList
      .map((PAEvent: TPlayerAnalyticsEvent, index: number) => {
        if (PAEvent.event === 'metadata') {
          return { index: -1, PAEvent: PAEvent };
        }
        return { index: index, PAEvent: PAEvent };
      })
      .filter((item) => item.index !== -1);

    try {
      if (filteredEvents[0].PAEvent['event'] !== 'init') {
        output.valid = false;
        output.message = generateErrorMessage("'init' is not the first event (except for 'metadata')");
        output.invalidEventIndex = filteredEvents[0].index;
      } else {
        let i = 0;
        while (i < filteredEvents.length - 1) {
          let nextIdx = i + 1;
          let nextEvent = filteredEvents[nextIdx].PAEvent;
          // Skip 'warning' & 'heartbeat' events. Select the next event that is not one of them.
          while (nextIdx < filteredEvents.length - 1 && ['warning', 'heartbeat'].includes(nextEvent.event)) {
            nextIdx++;
            nextEvent = filteredEvents[nextIdx].PAEvent;
          }
          // Check if next Event is only allowed to appear once
          if (this.singleAppearanceEvents[nextEvent.event] !== undefined) {
            this.singleAppearanceEvents[nextEvent.event]++;
            const currentCount = this.singleAppearanceEvents[nextEvent.event];
            if (currentCount > 1) {
              output.valid = false;
              output.message = generateErrorMessage(`'${nextEvent.event}' should only occur once per session`);
              output.invalidEventIndex = filteredEvents[nextIdx].index;
              break;
            }
          }
          // Check if next Event is unknown
          if (!this.events[nextEvent.event]) {
            output.valid = false;
            output.message = generateErrorMessage(`'${nextEvent.event}' is not a supported event type`);
            output.invalidEventIndex = filteredEvents[nextIdx].index;
            break;
          }
          // Special Case: Paused/Playing rules
          else if (this._invalidPausedPlayingEvent(nextEvent.event)) {
            output.valid = false;
            output.message = generateErrorMessage(
              `'${nextEvent.event}' without a preceeding '${nextEvent.event === 'playing' ? 'paused' : 'playing'}'`
            );
            output.invalidEventIndex = filteredEvents[nextIdx].index;
            break;
          }
          // Check if next Event is not suppose to be after current
          else if (
            this.events[filteredEvents[i].PAEvent['event']] &&
            this.events[filteredEvents[i].PAEvent['event']].includes(nextEvent.event)
          ) {
            output.valid = false;
            output.message = generateErrorMessage(
              `'${nextEvent.event}' should not come after '${filteredEvents[i].PAEvent['event']}'`
            );
            output.invalidEventIndex = filteredEvents[nextIdx].index;
            break;
          }

          // Incremet
          if (nextIdx !== i + 1) {
            i = nextIdx;
          } else {
            i++;
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }

    this.prevPlayPauseStatus = PlayPauseStatus.NONE;

    return output;
  }

  _invalidPausedPlayingEvent = (event: string): boolean => {
    if (event === 'paused') {
      if (this.prevPlayPauseStatus === PlayPauseStatus.PLAYING) {
        this.prevPlayPauseStatus = PlayPauseStatus.PAUSED;
        return false;
      }
      return true;
    }
    if (event === 'playing') {
      if ([PlayPauseStatus.PAUSED, PlayPauseStatus.NONE].includes(this.prevPlayPauseStatus)) {
        this.prevPlayPauseStatus = PlayPauseStatus.PLAYING;
        return false;
      }
      return true;
    }
    return false;
  };
}
