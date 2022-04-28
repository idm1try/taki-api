import { Request } from 'express';

export interface Payload {
  userId: string;
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export interface ParsedUserPayload {
  userId: string;
  refreshToken?: string;
  email?: string;
}

export interface RequestWithParsedPayload extends Request {
  user: ParsedUserPayload;
}
