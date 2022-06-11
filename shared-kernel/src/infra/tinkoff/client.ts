import { createSdk } from 'invest-nodejs-grpc-sdk';

const client = createSdk(process.env.TINKOFF_TOKEN, 'drublev');

export default client;
