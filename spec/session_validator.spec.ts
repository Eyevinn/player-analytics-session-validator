import * as main from '../services/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBAdapter } from '@eyevinn/player-analytics-shared';

const ddbMock = mockClient(DynamoDBClient);
let request: any;

const GenerateMockEventSequence = (eventNames: string[]) => {
  const baseMockTimestamp = 1640201000;
  let eventSequence: any = [];
  for (let i = 0; i < eventNames.length; i++) {
    eventSequence.push({
      event: eventNames[i],
      sessionId: '123-214-234',
      timestamp: baseMockTimestamp + i,
      playhead: 0,
      duration: 0,
      host: 'mock.eyevinn.technology',
    });
  }
  return eventSequence;
};

describe('session-validator module', () => {
  beforeEach(() => {
    request = {
      path: '/session/123-214-234',
      httpMethod: 'GET',
      clientIp: '2001:cdba::3257:9652',
      headers: {
        'user-agent': [
          {
            key: 'User-Agent',
            value: 'test-agent',
          },
        ],
        host: 'mock.eyevinn.technology',
      },
      body: '{}',
    };
    process.env.AWS_REGION = 'us-east-1';
    process.env.DB_TYPE = 'DYNAMODB';
    process.env.TABLE_NAME = 'mock-table';
    ddbMock.reset();
  });
  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.DB_TYPE;
    delete process.env.TABLE_NAME;
  });

  it('can validate Valid Event sequences correctly', async () => {
    // Arrange
    const mockSequence = [
      {
        event: 'init',
        sessionId: '123-214-234',
        timestamp: 1640193000,
        playhead: 0,
        duration: 0,
        host: 'mock.eyevinn.technology',
      },
      {
        event: 'stopped',
        sessionId: '123-214-234',
        timestamp: 1640193001,
        playhead: 0,
        duration: 0,
        host: 'mock.eyevinn.technology',
      },
    ];
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(mockSequence);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const expectedResponse = {
      sessionId: '123-214-234',
      Events: [
        {
          event: 'init',
          sessionId: '123-214-234',
          timestamp: 1640193000,
          playhead: 0,
          duration: 0,
        },
        {
          event: 'stopped',
          sessionId: '123-214-234',
          timestamp: 1640193001,
          playhead: 0,
          duration: 0,
        },
      ],
      valid: true,
    };

    expect(response.body).toEqual(JSON.stringify(expectedResponse));
  });

  it('can validate Valid Event sequence correctly, example #2', async () => {
    // Arrange
    let index = 0;

    const validTestSequences = [
      ['init', 'stopped'],
      ['init', 'metadata', 'warning', 'error', 'stopped'],
      ['init', 'loading', 'loaded', 'seeking', 'seeked', 'playing'],
      ['metadata', 'init', 'loading', 'loaded', 'playing', 'bitrate_changed', 'stopped'],
      ['init', 'loading', 'loaded', 'playing', 'seeking', 'seeked', 'paused', 'playing', 'stopped'],
      ['init', 'loading', 'loaded', 'playing', 'buffering', 'seeking', 'seeked', 'paused', 'playing', 'stopped'],
      ['init', 'loading', 'loaded', 'playing', 'buffering', 'paused', 'buffered', 'playing', 'stopped'],
      ['init', 'loading', 'loaded', 'playing', 'seeking', 'paused', 'seeked', 'playing', 'stopped'],
      ['init', 'warning', 'loading', 'heartbeat', 'loaded', 'metadata', 'error', 'stopped'],
      ['init', 'heartbeat', 'heartbeat', 'heartbeat', 'heartbeat', 'heartbeat', 'heartbeat', 'heartbeat', 'heartbeat'],
    ];

    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(GenerateMockEventSequence(validTestSequences[index]));
    });
    for (let i = 0; i < validTestSequences.length; i++) {
      // Act
      const response = await main.handler(request);
      // Assert
      const responseJson = JSON.parse(response.body as string);
      if (!responseJson.valid) console.log(responseJson);
      expect(responseJson.valid).toEqual(true);
      index++;
    }
  });

  it('should invalidate Event sequence where: "init" is not first', async () => {
    // Arrange
    const testSequence = [
      'metadata',
      'metadata',
      'loading',
      'loaded',
      'metadata',
      'init',
      'loading',
      'stopped',
      'metadata',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual(
      "Faulty event sequence: 'init' is not the first event (except for 'metadata')"
    );
    expect(responseJson.invalidEventIndex).toEqual(2);
  });

  it('should invalidate Event sequence where: an event follows "stopped"', async () => {
    // Arrange
    const testSequence = ['metadata', 'init', 'stopped', 'error'];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'error' should not come after 'stopped'");
    expect(responseJson.invalidEventIndex).toEqual(3);
  });

  it('should invalidate Event sequence where: "buffering" follows "seeking"', async () => {
    // Arrange
    const testSequence = [
      'metadata',
      'init',
      'loading',
      'loaded',
      'seeking',
      'warning',
      'heartbeat',
      'buffering',
      'buffered',
      'seeking',
      'seeked',
      'playing',
      'paused',
      'heartbeat',
      'playing',
      'warning',
      'stopped',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'buffering' should not come after 'seeking'");
    expect(responseJson.invalidEventIndex).toEqual(7);
  });

  it('should invalidate Event sequence where: "paused" has not come before non-first "playing"', async () => {
    // Arrange
    const testSequence = [
      'init',
      'loading',
      'loaded',
      'heartbeat',
      'metadata',
      'playing',
      'seeking',
      'warning',
      'seeked',
      'metadata',
      'playing',
      'stopped',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'playing' without a preceeding 'paused'");
    expect(responseJson.invalidEventIndex).toEqual(10);
  });

  it('should invalidate Event sequence when an Unknown event is found', async () => {
    // Arrange
    const testSequence = [
      'init',
      'loading',
      'loaded',
      'super-mock-event',
      'playing',
      'seeking',
      'seeked',
      'metadata',
      'paused',
      'stopped',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'super-mock-event' in not a supported event type");
    expect(responseJson.invalidEventIndex).toEqual(3);
  });

  it('should invalidate Event sequence where: "loading" appears more than once', async () => {
    // Arrange
    const testSequence = [
      'init',
      'loading',
      'loaded',
      'heartbeat',
      'loading',
      'playing',
      'seeking',
      'seeked',
      'metadata',
      'paused',
      'stopped',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'loading' should only occur once per session");
    expect(responseJson.invalidEventIndex).toEqual(4);
  });

  it('should invalidate Event sequence where: "loaded" appears more than once', async () => {
    // Arrange
    const testSequence = [
      'init',
      'loading',
      'loaded',
      'heartbeat',
      'metadata',
      'loaded',
      'playing',
      'seeking',
      'seeked',
      'metadata',
      'paused',
      'stopped',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'loaded' should only occur once per session");
    expect(responseJson.invalidEventIndex).toEqual(5);
  });

  it('should invalidate Event sequence where: "error" appears more than once', async () => {
    // Arrange
    const testSequence = [
      'init',
      'loading',
      'loaded',
      'heartbeat',
      'metadata',
      'playing',
      'warning',
      'paused',
      'error',
      'heartbeat',
      'error',
      'stopped',
    ];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'error' should only occur once per session");
    expect(responseJson.invalidEventIndex).toEqual(10);
  });

  it('should invalidate Event sequence where: "stopped" appears more than once', async () => {
    // Arrange
    const testSequence = ['init', 'loading', 'loaded', 'metadata', 'playing', 'stopped', 'metadata', 'stopped'];
    const invalidEventSequences = GenerateMockEventSequence(testSequence);
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidEventSequences);
    });
    // Act
    const response = await main.handler(request);
    // Assert
    const responseJson = JSON.parse(response.body as string);
    expect(responseJson.valid).toEqual(false);
    expect(responseJson.message).toEqual("Faulty event sequence: 'stopped' should only occur once per session");
    expect(responseJson.invalidEventIndex).toEqual(7);
  });

  it('can sort and validate a list of events', async () => {
    const unsortedTestEvents = [
      { event: 'loaded', sessionId: '123-214-234', timestamp: 1640195099, playhead: 1, duration: 8, host: 'mock' },
      { event: 'loading', sessionId: '123-214-234', timestamp: 1640193099, playhead: 2, duration: 8, host: 'mock' },
      { event: 'init', sessionId: '123-214-234', timestamp: 1640191099, playhead: 3, duration: 8, host: 'mock' },
    ];
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(unsortedTestEvents);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: [
          { event: 'init', sessionId: '123-214-234', timestamp: 1640191099, playhead: 3, duration: 8 },
          { event: 'loading', sessionId: '123-214-234', timestamp: 1640193099, playhead: 2, duration: 8 },
          { event: 'loaded', sessionId: '123-214-234', timestamp: 1640195099, playhead: 1, duration: 8 },
        ],
        valid: true,
      })
    );
  });

  it('should ignore request if "path" != "/session" ', async () => {
    const event = request;
    event.path = '/';
    const response = await main.handler(event);
    expect(response.statusCode).toEqual(404);
    expect(response.statusDescription).toEqual('Not Found');
    expect(response.body).toEqual('{"message": Not Found}');
  });

  it('should return message in requests if "DB_TYPE" env is not set', async () => {
    process.env.DB_TYPE = undefined;
    const response = await main.handler(request);

    expect(response.statusCode).toEqual(200);
    expect(response.statusDescription).toEqual('OK');
    expect(response.body).toEqual('{"sessionId":"123-214-234","message":"Failed getting Events from DB"}');
  });
});
