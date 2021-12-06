import { Request, Response, NextFunction } from 'express';
import { Cookie } from '../../configuration/cookies';
import { ApiSuccess } from '../success.class';

/**
 * GET /authentication/logout
 *
 * Deletes the authentification cookie
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
export async function logoutGetRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  res.clearCookie(Cookie.AUTH);
  const response = new ApiSuccess(200);
  next(response);
}
