import { Logger } from 'pino';

declare global {
  namespace Express {
    export interface Request {
      user: {
        id: string;
      };
      log: Logger;
    }
  }
}
