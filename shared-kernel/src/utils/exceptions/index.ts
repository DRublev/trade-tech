export class ExhaustedException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidArgumentException extends Error {
  constructor(argName: string, message: string) {
    super(`${argName}: ${message}`);
  }
}

export class InvalidOperationException extends Error {
  constructor(message: string) {
    super(message);
  }
}
