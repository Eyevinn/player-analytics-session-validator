import * as main from '../services/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBAdapter } from '@eyevinn/player-analytics-shared';

const ddbMock = mockClient(DynamoDBClient);
let request: any;
let testEvents: any;

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
    testEvents = [
      {
        event: 'buffered',
        sessionId: '123-214-234',
        timestamp: 1640193099,
        playhead: 3,
        duration: 3,
        host: 'mock.eyevinn.technology',
      },
      {
        event: 'paused',
        sessionId: '123-214-234',
        timestamp: 1640192099,
        playhead: 2,
        duration: 2,
        host: 'mock.eyevinn.technology',
      },
      {
        event: 'playing',
        sessionId: '123-214-234',
        timestamp: 1640191099,
        playhead: 1,
        duration: 1,
        host: 'mock.eyevinn.technology',
      },
      {
        event: 'loaded',
        sessionId: '123-214-234',
        timestamp: 1640190699,
        playhead: 1,
        duration: 1,
        host: 'mock.eyevinn.technology',
      },
      {
        event: 'loading',
        sessionId: '123-214-234',
        timestamp: 1640190599,
        playhead: 1,
        duration: 1,
        host: 'mock.eyevinn.technology',
      },
      {
        event: 'init',
        sessionId: '123-214-234',
        timestamp: 1640190099,
        playhead: 0,
        duration: 0,
        host: 'mock.eyevinn.technology',
      },
    ];
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

  it('can sort and validate a list of events', async () => {
    const validatedEvents = {
      Events: [
        {
          valid: true,
          event: 'init',
          sessionId: '123-214-234',
          timestamp: 1640190099,
          playhead: 0,
          duration: 0,
        },
        {
          valid: true,
          event: 'loading',
          sessionId: '123-214-234',
          timestamp: 1640190599,
          playhead: 1,
          duration: 1,
        },
        {
          valid: true,
          event: 'loaded',
          sessionId: '123-214-234',
          timestamp: 1640190699,
          playhead: 1,
          duration: 1,
        },
        {
          valid: true,
          event: 'playing',
          sessionId: '123-214-234',
          timestamp: 1640191099,
          playhead: 1,
          duration: 1,
        },
        {
          valid: true,
          event: 'paused',
          sessionId: '123-214-234',
          timestamp: 1640192099,
          playhead: 2,
          duration: 2,
        },
        {
          valid: false,
          event: 'buffered',
          sessionId: '123-214-234',
          timestamp: 1640193099,
          playhead: 3,
          duration: 3,
        },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(
      function () {
        return Promise.resolve(testEvents);
      }
    );
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
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
    expect(response.body).toEqual('{"sessionId":"123-214-234","message":"Cannot get events from DB"}');
  });
});
