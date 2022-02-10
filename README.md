# player-analytics-session-validator

The Eyevinn Player Analytics (EPAS) is an open sourced framework and specification for tracking events from video players. It is a modular framework where you can pick and choose the modules you need. This is the session validator module that validates the data from the worker and database.

## AWS

To run the session validator in AWS as a Lambda function and DynamoDB as the database:

```javascript
// your index.js
const { Lambda } = require("@eyevinn/player-analytics-session-validator");

export const handler = Lambda.handler;
```
To use with DynamoDB add the following environment variables to the Lambda configuration.

```
DB_TYPE = <DYNAMODB | MONGODB>
TABLE_NAME = <table name>
```

## Development
The simplest way to run a session validator locally is to use the fastify service, by running `npm run dev`. This will spin up a local server at port 3000 which you can use as session validator. You may as well specify your environment variables as the standard specifies.

e.g. `DB_TYPE=MONGODB` `npm run dev` will start a fastify service towards your local MongoDB as database.

# About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
