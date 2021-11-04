import { object } from "joi";
import { generateJWToken } from "..";
import { ApiError } from "../../error.class";
import { ApiSuccess } from "../../success.class";
import { loggerFile } from "../../../configuration/logger";
import { Response, Request, NextFunction } from 'express';
import { config } from "../../../configuration/environment";
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { IUserDocument, User, userUsernameValidationSchema } from "../../../schemas/user.schema";


/**
 * User Input Validation 
 */
const authAssertionPostRequestSchema = object({
  username: userUsernameValidationSchema,
  assertionResponse: object().unknown().required().description('Webauthn challenge')
});


/**
 * POST /webauthn/login
 *
 * Validates the challenge done by user to login
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function authAssertionPostRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const assertionPostRequest = authAssertionPostRequestSchema.validate(req.body);
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
