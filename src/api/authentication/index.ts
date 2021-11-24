/* eslint  @typescript-eslint/no-unused-vars: 0 */
import jwt from 'jsonwebtoken';
import expressjwt from 'express-jwt';
import { config } from "../../configuration/environment";
import { NextFunction, Request, Response } from 'express';
import { ApiSuccess } from '../success.class';
import { createHash, Hash } from 'crypto';
import { Roles } from '../../roles';
import { ApiError } from '../error.class';

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
export function hasRole(role: Roles): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request & JWT, res: Response, next: NextFunction) => {
    req.token.data.roles.indexOf(role) === -1
    ? next(new ApiError(403, "User has not the required privileges to perform this action!"))
    : next();
  }
}

/**
 * Returns the jwt from the request header
 *
 * @param {Request} req
 * @returns {(string | null)} jwt or null
 */
export function getTokenFromHeader(req: Request): string | null {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}

/**
 * Middleware to ensure that the user is authenticated
 */
export const isAuth = expressjwt({
  algorithms: ['HS256'],
  getToken: getTokenFromHeader,
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
 export function authVerify(req: Request, res: Response, next: NextFunction) {
  const response = new ApiSuccess(200);
  next(response);
}
