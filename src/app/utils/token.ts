import { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtHelpers } from "./jwt";
import { envVars } from "../../config/env";
import { Response } from "express";
import { cookieHelpers } from "./cookie";

const getAccessToken = (payload: JwtPayload) => {
  const accessToken = jwtHelpers.createToken(
    payload,
    envVars.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: envVars.JWT_ACCESS_TOKEN_EXPIRES_IN,
    } as SignOptions,
  );
  return accessToken;
};

const getRefreshToken = (payload: JwtPayload) => {
  const refreshToken = jwtHelpers.createToken(
    payload,
    envVars.JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: envVars.JWT_REFRESH_TOKEN_EXPIRES_IN,
    } as SignOptions,
  );
  return refreshToken;
};

const setAccessTokenCookie = (res: Response, token: string) => {
  cookieHelpers.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 1000,
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  cookieHelpers.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 1000 * 7,
  });
};

export const tokenHelpers = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
};
