import winston from 'winston';

export default class Validator {
  logger: winston.Logger;
  events: any;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.events = {
      // Event name : Non allowed events
      init: ['loaded', 'buffered', 'seeked'],
      heartbeat: ['init'],
      loading: ['init', 'seeked', 'buffered'],
      loaded: ['init', 'loading', 'seeked', 'buffered'],
      playing: ['init', 'loading', 'loaded', 'buffered', 'seeked'],
      paused: ['init', 'loading', 'loaded', 'buffered', 'seeked'],
      buffering: ['init', 'loading', 'loaded', 'seeked'],
      buffered: ['init', 'loading', 'loaded', 'seeked'],
      seeking: ['init', 'loading', 'loaded', 'buffered'],
      seeked: ['init', 'loading', 'loaded', 'buffered'],
      bitrate_changed: ['init', 'loading', 'loaded', 'buffered', 'seeked'],
      stopped: ['init', 'loading', 'loaded', 'buffered', 'seeked'],
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
      ],
      warning: ['init', 'loading'],
    };
  }

  /**
   *
   * @param eventsList list of sorted events
   * @returns list of validated events
   */
  validateEventOrder(eventsList: any[]): any[] {
    if(!eventsList) return eventsList;
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
