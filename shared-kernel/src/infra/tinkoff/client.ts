import { createSdk } from 'invest-nodejs-grpc-sdk';

export const createClient = (token: string) => createSdk(token, 'drublev');

export type TinkoffClient = ReturnType<typeof createClient>;
