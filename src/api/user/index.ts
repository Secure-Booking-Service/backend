import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../error.class';
import { ApiSuccess } from '../success.class';
import { loggerFile } from '../../configuration/logger';
import { RegistrationToken } from '../../schemas/registrationToken.schema';
import { config } from '../../configuration/environment';

/****************************************
 *          Endpoint Handlers           *
 * **************************************/

/**
 * POST /user
 * Creates and returns a new registration token
 *
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
 export async function userPostRequest(req: Request, res: Response, next: NextFunction) {

  try {

      // Create a new registration token
      const token = await new RegistrationToken().save();
      if (token === null || token === undefined) throw new ApiError(500, 'Unable to create registration token');

      // Return token
      const responseBody = {
          token: token.key,
          lifetime: config.registrationTokenLifetime,
      };

      const response = new ApiSuccess(201, responseBody);
      next(response);

  } catch (err) {
      loggerFile.error(err.message);
      next(err);
  }
}
