export const ipcEvents = {
  ENCRYPT_STRING: 'ENCRYPT_STRING',
  DECRYPT_STRING: 'DECRYPT_STRING',
  SAVE_TO_STORE: 'SAVE_TO_STORE',
  GET_FROM_STORE: 'GET_FROM_STORE',

  TINKOFF_CREATE_SDK: 'TINKOFF_CREATE_SDK',
  TINKOFF_GET_ACCOUNTS: 'TINKOFF_GET_ACCOUNTS',
  TINKOFF_SUBSCRIBE_ON_CANDLES: 'TINKOFF_SUBSCRIBE_ON_CANDLES',
  TINKOFF_GET_CANDLES_STREAM: 'TINKOFF_GET_CANDLES_STREAM',
  TINKOFF_ON_CANDLES_STREAM: 'TINKOFF_ON_CANDLES_STREAM',

  START_TRADING: 'START_TRADING',
  PAUSE_TRADING: 'PAUSE_TRADING',
  RESUME_TRADING: 'RESUME_TRADING',
  CHANGE_CONFIG: 'CHANGE_CONFIG',
  strategylog: 'strategylog',
  test: 'test',
};
