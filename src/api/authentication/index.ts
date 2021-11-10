/* eslint  @typescript-eslint/no-unused-vars: 0 */
import jwt from 'jsonwebtoken';
import expressjwt from 'express-jwt';
import { config } from "../../configuration/environment";
import { NextFunction, Request } from 'express';
import { IUserDocument } from '../../schemas/user.schema';
import { ApiSuccess } from '../success.class';
import { createHash, Hash } from 'crypto';

/****************************************
 *          Helper functions            *
 * **************************************/

/**
 * Retruns hash object used to has the email address
 * @export
 * @return {Hash} 
 */
export function getHash(): Hash {
  return createHash('sha256'); 
}

/**
 * Generates a signed jwt token, which contains the user
 * object
 *
 * @param {IUserDocument} user
 * @returns jwt
 */
 export function generateJWToken(data: { email: string, roles: string[] }) {
  const signature = config.jwt.secret;
  const expiration = config.jwt.expiresIn;

  return jwt.sign({ data, }, signature, { expiresIn: expiration });
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
