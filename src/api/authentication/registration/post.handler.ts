import { object } from "joi";
import { ApiError } from "../../error.class";
import { ApiSuccess } from "../../success.class";
import { loggerFile } from "../../../configuration/logger";
import { config } from "../../../configuration/environment";
import { IAuthenticatorDocument } from "../../../schemas/authenticator.schema";
import { Request, Response, NextFunction } from 'express';
import { User, userUsernameValidationSchema } from "../../../schemas/user.schema";
import { RegistrationToken, registrationTokenValidationSchema } from "../../../schemas/registrationToken.schema";
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { generateJWToken } from "..";

/**
 * User Input Validation
 */
const authAttestationPostRequestSchema = object({
  username: userUsernameValidationSchema,
  token: registrationTokenValidationSchema,
  attestationResponse: object().unknown().required().description('Webauthn challenge')
});


/**
 * POST /authentication/register
 *
 * Validates the attestation response done by user to register a new device
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function authAttestationPostRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const attestationPostRequest = authAttestationPostRequestSchema.validate(req.body);
    if (attestationPostRequest.error) throw new ApiError(400, attestationPostRequest.error.message);

    // 2. Validate registration token
    const registrationTokenDoc = await RegistrationToken.findOne({ 'key': attestationPostRequest.value.token });
    if (registrationTokenDoc === null) throw new ApiError(404, 'Registration token not found or expired');

    // 3. Get user document
    const userDoc = await User.findOne({ username: attestationPostRequest.value.username });
    if (userDoc === null) throw new ApiError(404, 'User not found');
    if (userDoc.device) throw new ApiError(403, 'User already registered');
    if (userDoc.currentChallenge === undefined || userDoc.currentChallenge === null) throw new ApiError(400, 'User has no pending challenge');

    // 4. Verify challenge
    try {
      const { verified, registrationInfo } = await verifyRegistrationResponse({
        credential: attestationPostRequest.value.attestationResponse,
        expectedChallenge: userDoc.currentChallenge,
        expectedOrigin: config.rp.origin,
        expectedRPID: config.rp.id,
      });

      // If challenge has not been completed successfully, throw an error
      if (!verified || !registrationInfo) throw new ApiError(401, 'Challenge has not been solved correctly');

      // 5. Save authenticator
      const { credentialPublicKey, credentialID, counter } = registrationInfo;
      userDoc.device = { credentialID, credentialPublicKey, counter } as IAuthenticatorDocument;

      // 6. Save whether user is deletable or not
      userDoc.deletable = registrationTokenDoc.userIsDeletable;

      // 7. Delete registration token
      registrationTokenDoc.delete();

      // 8. Send jwt to user
      const response = new ApiSuccess(200, { 'accesstoken': generateJWToken(userDoc) });
      next(response);

    } catch (error) {
      // Looks like a bad request
      throw new ApiError(400, error.message);

    } finally {
      // 8. Delete challenge from user. To try again, it is necessary to request a new challenge
      userDoc.currentChallenge = undefined;
      userDoc.save();
    }
  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}