/* eslint  @typescript-eslint/no-unused-vars: 0 */
import jwt from 'jsonwebtoken';
import expressjwt from 'express-jwt';
import { config } from "../../configuration/environment";
import { NextFunction, Request, Response } from 'express';
import { ApiSuccess } from '../success.class';
import { createHash, Hash } from 'crypto';
import { Roles } from '@secure-booking-service/common-types/Roles';
import { ApiError } from '../error.class';
import { Cookie } from '../../configuration/cookies';

interface JSONWebToken { 
  email: string,
  roles: string[] 
}

export type JWT = {
  token: {
    data: JSONWebToken,
    iat: number,
    exp: number,
  }
}


/****************************************
 *          Helper functions            *
 * **************************************/

/**
 * Returns hash object used to hash the email address
 * @export
 * @return {Hash} 
 */
export function getHash(): Hash {
  return createHash('sha256'); 
}

/**
 * Generates a signed jwt token, which contains limited information about the user
 *
 * @param {JSONWebToken} data
 * @returns jwt
 */
export function generateJWToken(data: JSONWebToken) {
  const signature = config.jwt.secret;
  const expiration = config.jwt.expiresIn;

  return jwt.sign({ data, }, signature, { expiresIn: expiration });
}

/**
 * Generates a middleware that validates, that the user has a give
 * role.
 * 
 * ! Should be used after jwt parsing
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function hasRoles(...roles: Roles[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request & JWT, res: Response, next: NextFunction) => {
    roles.some(role => req.token.data.roles.includes(role))
    ? next()
    : next(new ApiError(403, "User has not the required privileges to perform this action!"));
  }
}

/**
 * Returns the jwt from the cookies
 *
 * @param {Request} req
 * @returns {(string | null)} jwt or null
 */
export function getJSONWebToken(req: Request): string | null {
  return req.cookies[Cookie.AUTH] ?? null;
}

/**
 * Middleware to ensure that the user is authenticated
 */
export const isAuth = expressjwt({
  algorithms: ['HS256'],
  getToken: getJSONWebToken,
  userProperty: 'token',
  secret: config.jwt.secret,
});


/****************************************
 *          Endpoint Handlers           *
 * **************************************/

/**
 * Simple endpoint to verify that the user is authenticated
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export function authVerify(req: Request & JWT, res: Response, next: NextFunction) {
  const { email, roles } = req.token.data;
  let expiresIn = req.token.exp * 1000 - Date.now();
  if (expiresIn < 0) expiresIn = 0;
  
  const response = new ApiSuccess(200, { email, roles, expiresIn });
  next(response);
}
