import winston from 'winston';

export default class Validator {
  logger: winston.Logger;
  events: any;
  singleAppearanceEvents: {};

  constructor(logger: winston.Logger) {
    this.logger = logger;
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
      metadata: ['init'],
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
        'bitrate_changed',
      ],
      loaded: ['init', 'loading', 'seeked', 'buffered', 'loaded'],
      playing: ['init', 'loading', 'loaded', 'buffered', 'seeked', 'playing'],
      paused: ['init', 'loading', 'loaded', 'buffered', 'seeked', 'paused'],
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
  validateEventOrder(eventsList: any[]): any[] {
    if (!eventsList) return eventsList;
    this.logger.debug(`Number of events: ${eventsList.length}`);
    let events: any[] = [];
    try {
      if (eventsList[0]['event'] !== 'init') {
        eventsList[0]['valid'] = false;
      } else {
        eventsList[0]['valid'] = true;
      }
      for (let i = 0; i < eventsList.length; i++) {
        if (i !== eventsList.length - 1) {
          let nextEvent: any = { event: '' };
          nextEvent = eventsList[i + 1];
          // Check if next Event is only allowed to appear once
          if (this.singleAppearanceEvents[nextEvent['event']] !== undefined) {
            this.singleAppearanceEvents[nextEvent['event']]++;
            const currentCount = this.singleAppearanceEvents[nextEvent['event']];
            console.log('single:', currentCount, nextEvent['event']);
            if (currentCount > 1) {
              eventsList[i + 1]['valid'] = false;
              // Add validated event to list
              events.push({
                valid: eventsList[i]['valid'],
                event: eventsList[i]['event'],
                sessionId: eventsList[i]['sessionId'],
                timestamp: eventsList[i]['timestamp'],
                playhead: eventsList[i]['playhead'],
                duration: eventsList[i]['duration'],
              });
              continue;
            }
          }
          // Check if next Event is unknown
          if (!this.events[nextEvent['event']]) {
            eventsList[i + 1]['valid'] = false;
          }
          // Check if next Event is not suppose to be after current
          else if (
            this.events[eventsList[i]['event']] &&
            this.events[eventsList[i]['event']].includes(nextEvent['event'])
          ) {
            eventsList[i + 1]['valid'] = false;
          } else {
            eventsList[i + 1]['valid'] = true;
          }
        }
        // Check if 'init' is not first
        if (eventsList[i]['event'] === 'init' && i > 0) {
          eventsList[i]['valid'] = false;
        }
        // Add validated event to list
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
