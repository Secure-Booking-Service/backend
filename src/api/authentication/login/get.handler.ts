import Joi from "joi";
import { ApiError } from "../../error.class";
import { ApiSuccess } from "../../success.class";
import { NextFunction, Request, Response } from 'express';
import { loggerFile } from "../../../configuration/logger";
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { User, userUsernameValidationSchema } from "../../../schemas/user.schema";

/**
 * User Input Validation 
 */
const authAssertionGetRequestSchema = Joi.object({
  username: userUsernameValidationSchema,
});


/**
 * GET /authentication/login
 *
 * Handles requests to create a new challenge that is required,
 * to login a user.
 *
 * Expect: username parameter
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function authAssertionGetRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const assertionGetRequest = authAssertionGetRequestSchema.validate(req.query);
    if (assertionGetRequest.error) throw new ApiError(400, assertionGetRequest.error.message);

    // 2. Get user document
    const userDoc = await User.findOne({ username: assertionGetRequest.value.username });
    if (userDoc === null) throw new ApiError(404, 'User not found');
    if (userDoc.device === null || userDoc.device === undefined) throw new ApiError(403, 'User not registered');

    // 3. Generate challenge
    const options = generateAuthenticationOptions({
      // Require users to use a previously-registered authenticator
      allowCredentials: [{
        id: userDoc.device.credentialID,
        type: 'public-key'
      }],
      userVerification: 'preferred',
    });

    // 4. Save current challenge
    userDoc.currentChallenge = options.challenge;
    userDoc.save();

    // 5. Done
    const response = new ApiSuccess(200, options);
    next(response);

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
