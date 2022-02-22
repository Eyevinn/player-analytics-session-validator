import winston from 'winston';

export default class Validator {
  logger: winston.Logger;
  events: any;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.events = {
      // Event name : Non-allowed follow up event(s)
      init: [
        'loaded',
        'seeked',
        'seeking',
        'buffered',
        'buffering',
        'bitrate_changed',
        'init',
        'playing',
        'paused',
        'stopped',
      ],
      heartbeat: ['init'],
      metadata: ['init'],
      warning: ['init', 'loading'],
      stopped: ['init', 'loading', 'loaded', 'buffered', 'seeked', 'bitrate_changed', 'stopped'],
      error: [
        'init',
        'heartbeat',
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
        'metadata',
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
        'stopped',
        'bitrate_changed',
      ],
      loaded: ['init', 'loading', 'seeked', 'buffered', 'loaded'],
      playing: ['init', 'loading', 'loaded', 'buffered', 'seeked', 'playing'],
      paused: ['init', 'loading', 'loaded', 'buffered', 'seeked', 'paused', 'stopped'],
      buffering: ['init', 'loading', 'loaded', 'seeked', 'playing', 'paused', 'buffering', 'stopped'],
      buffered: ['init', 'loading', 'loaded', 'seeked', 'buffered'],
      seeking: ['init', 'loading', 'loaded', 'seeking', 'buffered', 'buffering', 'playing', 'paused', 'stopped'],
      seeked: ['init', 'loading', 'loaded', 'buffered', 'seeked'],
      bitrate_changed: ['init', 'loading', 'loaded', 'buffered', 'bitrate_changed'],
    };
  }

  /**
   *
   * @param eventsList list of sorted events
   * @returns list of validated events
   */
  validateEventOrder(eventsList: any[]): any[] {
    if (!eventsList) return eventsList;
    this.logger.debug(`Number of events: ${eventsList.length}`);
    let events: any[] = [];
    try {
      eventsList[0]['valid'] = true;
      for (let i = 0; i < eventsList.length; i++) {
        if (i !== eventsList.length - 1) {
          let nextEvent: any = { event: '' };
          nextEvent = eventsList[i + 1];
          if (this.events[eventsList[i]['event']].includes(nextEvent['event'])) {
            eventsList[i + 1]['valid'] = false;
          } else {
            eventsList[i + 1]['valid'] = true;
          }
        }
        if (eventsList[i]['event'] === 'init' && i > 0) {
          eventsList[i]['valid'] = false;
        }
        events.push({
          valid: eventsList[i]['valid'],
          event: eventsList[i]['event'],
          sessionId: eventsList[i]['sessionId'],
          timestamp: eventsList[i]['timestamp'],
          playhead: eventsList[i]['playhead'],
          duration: eventsList[i]['duration'],
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
    return events;
  }
}
