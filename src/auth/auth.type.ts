import { Request } from "express";

export type Payload = {
    userId: string;
};

export type Tokens = {
    accessToken: string;
    refreshToken: string;
};

export type ParsedUserPayload = {
    userId: string;
    refreshToken?: string;
    email?: string;
};

export type RequestWithParsedPayload = {
    user: ParsedUserPayload;
} & Request;

export enum AccountType {
    Email = "email",
    Facebook = "facebook",
    Google = "google",
}

export type ThirdPartyAccountInfo = {
    id: string;
    name: string;
    email: string;
};

export type DecodedToken = {
    userId: string;
    iat: number;
    exp: number;
};

export type SerializatedUser = {
    _id: string;
    name: string;
    email?: string;
    isVerify?: boolean;
    createdAt: Date;
    updatedAt: Date;
};
