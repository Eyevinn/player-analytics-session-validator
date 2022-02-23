import * as main from '../services/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBAdapter } from '@eyevinn/player-analytics-shared';
import { validTestSequences } from './test_event_sequences/valid';
import { invalidTestSequences } from './test_event_sequences/invalid';

const ddbMock = mockClient(DynamoDBClient);
let request: any;

const unsortedTestEvents = [
  {
    event: 'loading',
    sessionId: '123-214-234',
    timestamp: 1640193099,
    playhead: 3,
    duration: 3,
    host: 'mock.eyevinn.technology',
  },
  {
    event: 'loaded',
    sessionId: '123-214-234',
    timestamp: 1640195099,
    playhead: 2,
    duration: 2,
    host: 'mock.eyevinn.technology',
  },
  {
    event: 'init',
    sessionId: '123-214-234',
    timestamp: 1640191099,
    playhead: 1,
    duration: 1,
    host: 'mock.eyevinn.technology',
  },
];

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

  it('can validate Valid Event sequence correctly, example #1', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(validTestSequences[0]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Valid Event sequence correctly, example #2', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'error', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(validTestSequences[1]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Valid Event sequence correctly, example #3', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
        { valid: true, event: 'seeking', sessionId: '123-214-234', timestamp: 1640193003, playhead: 0, duration: 0 },
        { valid: true, event: 'seeked', sessionId: '123-214-234', timestamp: 1640193004, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193005, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(validTestSequences[2]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Valid Event sequence correctly, example #4', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193003, playhead: 0, duration: 0 },
        { valid: true, event: 'seeking', sessionId: '123-214-234', timestamp: 1640193004, playhead: 0, duration: 0 },
        { valid: true, event: 'paused', sessionId: '123-214-234', timestamp: 1640193005, playhead: 0, duration: 0 },
        { valid: false, event: 'seeked', sessionId: '123-214-234', timestamp: 1640193006, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193007, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193008, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(validTestSequences[3]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Valid Event sequence correctly, example #5', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193003, playhead: 0, duration: 0 },
        { valid: true, event: 'buffering', sessionId: '123-214-234', timestamp: 1640193004, playhead: 0, duration: 0 },
        { valid: true, event: 'seeking', sessionId: '123-214-234', timestamp: 1640193005, playhead: 0, duration: 0 },
        { valid: true, event: 'seeked', sessionId: '123-214-234', timestamp: 1640193006, playhead: 0, duration: 0 },
        { valid: true, event: 'paused', sessionId: '123-214-234', timestamp: 1640193007, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193008, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193009, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(validTestSequences[4]);
    });
    const response = await main.handler(request);
    const body = response.body as string;
    console.log(JSON.stringify(JSON.parse(body), null, 2));
    expect(body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Invalid Event sequence correctly, example #1', async () => {
    const validatedEvents = {
      Events: [
        { valid: false, event: 'loading', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: false, event: 'init', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidTestSequences[0]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Invalid Event sequence correctly, example #2', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: false, event: 'error', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidTestSequences[1]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Invalid Event sequence correctly, example #3', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
        { valid: true, event: 'seeking', sessionId: '123-214-234', timestamp: 1640193003, playhead: 0, duration: 0 },
        { valid: false, event: 'buffering', sessionId: '123-214-234', timestamp: 1640193004, playhead: 0, duration: 0 },
        { valid: true, event: 'buffered', sessionId: '123-214-234', timestamp: 1640193005, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidTestSequences[2]);
    });
    const response = await main.handler(request);

    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Invalid Event sequence correctly, example #4', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193003, playhead: 0, duration: 0 },
        { valid: false, event: 'playing', sessionId: '123-214-234', timestamp: 1640193004, playhead: 0, duration: 0 },
        { valid: true, event: 'seeking', sessionId: '123-214-234', timestamp: 1640193005, playhead: 0, duration: 0 },
        { valid: true, event: 'paused', sessionId: '123-214-234', timestamp: 1640193006, playhead: 0, duration: 0 },
        { valid: false, event: 'seeked', sessionId: '123-214-234', timestamp: 1640193007, playhead: 0, duration: 0 }, // seeded after pause?
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193008, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193009, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidTestSequences[3]);
    });
    const response = await main.handler(request);
    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can validate Invalid Event sequence correctly, example #5', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640193000, playhead: 0, duration: 0 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193001, playhead: 0, duration: 0 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640193002, playhead: 0, duration: 0 },
        { valid: true, event: 'playing', sessionId: '123-214-234', timestamp: 1640193003, playhead: 0, duration: 0 },
        { valid: false, event: 'buffered', sessionId: '123-214-234', timestamp: 1640193004, playhead: 0, duration: 0 },
        { valid: true, event: 'seeking', sessionId: '123-214-234', timestamp: 1640193005, playhead: 0, duration: 0 },
        { valid: false, event: 'buffering', sessionId: '123-214-234', timestamp: 1640193006, playhead: 0, duration: 0 },
        { valid: true, event: 'stopped', sessionId: '123-214-234', timestamp: 1640193007, playhead: 0, duration: 0 },
        { valid: false, event: 'loading', sessionId: '123-214-234', timestamp: 1640193008, playhead: 0, duration: 0 },
        { valid: true, event: 'metadata', sessionId: '123-214-234', timestamp: 1640193009, playhead: 0, duration: 0 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(invalidTestSequences[4]);
    });
    const response = await main.handler(request);
    console.log(response.body);
    expect(response.body).toEqual(
      JSON.stringify({
        sessionId: '123-214-234',
        Events: validatedEvents.Events,
      })
    );
  });

  it('can sort and validate a list of events', async () => {
    const validatedEvents = {
      Events: [
        { valid: true, event: 'init', sessionId: '123-214-234', timestamp: 1640191099, playhead: 1, duration: 1 },
        { valid: true, event: 'loading', sessionId: '123-214-234', timestamp: 1640193099, playhead: 3, duration: 3 },
        { valid: true, event: 'loaded', sessionId: '123-214-234', timestamp: 1640195099, playhead: 2, duration: 2 },
      ],
    };
    spyOn(DynamoDBAdapter.prototype, 'getItemsBySession').and.callFake(function () {
      return Promise.resolve(unsortedTestEvents);
    });
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
