import Joi from "joi";
import { ApiError } from "../error.class";
import { ApiSuccess } from "../success.class";
import { NextFunction, Request, Response } from 'express';
import { loggerFile } from "../../configuration/logger";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { IUserDocument, User, userUsernameValidationSchema } from "../../schemas/user.schema";
import { config } from "../../configuration/environment";
import { generateJWToken } from ".";

/**
 * User Input Validation 
 */
const loginGetRequestSchema = Joi.object({
  username: userUsernameValidationSchema,
});

const loginPostRequestSchema = Joi.object({
  username: userUsernameValidationSchema,
  assertionResponse: Joi.object().unknown().required().description('Webauthn challenge')
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
 export async function loginGetRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const assertionGetRequest = loginGetRequestSchema.validate(req.query);
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

/**
 * POST /authentication/login
 *
 * Validates the challenge done by user to login
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function loginPostRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const assertionPostRequest = loginPostRequestSchema.validate(req.body);
    if (assertionPostRequest.error) throw new ApiError(400, assertionPostRequest.error.message);

    // 2. Get user document
    const userDoc: IUserDocument = await User.findOne({ username: assertionPostRequest.value.username });
    if (userDoc === null) throw new ApiError(404, 'User not found');
    if (userDoc.device === null || userDoc.device === undefined) throw new ApiError(403, 'User not registered');
    if (userDoc.currentChallenge === undefined || userDoc.currentChallenge === null) throw new ApiError(400, 'User has no pending challenge');

    // 3. Get authenticator
    const authenticator = userDoc.device;

    // 4. Verify challenge
    try {
      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        credential: assertionPostRequest.value.assertionResponse,
        expectedChallenge: userDoc.currentChallenge,
        expectedOrigin: config.rp.origin,
        expectedRPID: config.rp.id,
        authenticator,
      });

      // If challenge has not been completed successfully, throw an error
      if (!verified || !authenticationInfo) throw new ApiError(401, 'Challenge has not been solved correctly');

      // 5. Increase counter for authenticator
      authenticator.counter = authenticationInfo.newCounter;
      authenticator.save();

      // 6. Send jwt to user
      const response = new ApiSuccess(200, { 'accesstoken': generateJWToken(userDoc) });
      next(response);

    } catch (error) {
      // Looks like a bad request
      throw new ApiError(400, error.message);

    } finally {
      // 7. Delete challenge from user. To try again, it is necessary to request a new challenge
      userDoc.currentChallenge = undefined;
      userDoc.save();
    }
  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
