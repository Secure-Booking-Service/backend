import Joi from "joi";
import { ApiError } from "../error.class";
import { ApiSuccess } from "../success.class";
import { loggerFile } from "../../configuration/logger";
import { config } from "../../configuration/environment";
import { IAuthenticatorDocument } from "../../schemas/authenticator.schema";
import { userEmailValidationSchema, User } from "../../schemas/user.schema";
import { Request, Response, NextFunction } from 'express';
import { RegistrationToken, registrationTokenValidationSchema } from "../../schemas/registrationToken.schema";
import { GenerateRegistrationOptionsOpts, generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { generateJWToken, getHash } from ".";
import { Roles } from "@secure-booking-service/common-types/Roles";

/**
 * User input validation
 */
const registerGetRequestSchema = Joi.object({
  email: userEmailValidationSchema,
  token: registrationTokenValidationSchema,
});

const registerPostRequestSchema = Joi.object({
  email: userEmailValidationSchema,
  token: registrationTokenValidationSchema,
  attestationResponse: Joi.object().unknown().required().description('Webauthn challenge')
});


/**
 * GET /authentication/register
 *
 * Handles requests to create a new challenge that is required
 * to register a new device.
 *
 * Expect: token and email parameter
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function registerGetRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const attestationGetRequest = registerGetRequestSchema.validate(req.query);
    if (attestationGetRequest.error) throw new ApiError(400, attestationGetRequest.error.message);

    // 2. Validate registration token
    const registrationTokenDoc = await RegistrationToken.findOne({ 'key': attestationGetRequest.value.token });
    if (registrationTokenDoc === null) throw new ApiError(404, 'Registration token not found or expired');

    // 3. Get user document; create if it does not exist
    const email = getHash().update(attestationGetRequest.value.email).digest('hex');
    let userDoc = await User.findOne({ email });
    if (userDoc === null) userDoc = new User({ email });
    if (userDoc.device) throw new ApiError(403, 'User already registered');

    // 4. Create attestation challenge
    const attestationOptionsOpts: GenerateRegistrationOptionsOpts = {
      rpName: config.rp.name,
      rpID: config.rp.id,
      userID: userDoc._id,
      userName: attestationGetRequest.value.email,
      timeout: 60000,
      attestationType: 'indirect',
      authenticatorSelection: {
        userVerification: 'preferred',
        requireResidentKey: false,
      },
    };

    const attestationOptions = generateRegistrationOptions(attestationOptionsOpts);

    // 5. Save current challenge to user
    userDoc.currentChallenge = attestationOptions.challenge;
    userDoc.save();
    
    // 4. Done
    const response = new ApiSuccess(200, attestationOptions);
    next(response);

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}

/**
 * POST /authentication/register
 *
 * Validates the attestation response done by user to register a new device
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function registerPostRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const attestationPostRequest = registerPostRequestSchema.validate(req.body);
    if (attestationPostRequest.error) throw new ApiError(400, attestationPostRequest.error.message);

    // 2. Validate registration token
    const registrationTokenDoc = await RegistrationToken.findOne({ 'key': attestationPostRequest.value.token });
    if (registrationTokenDoc === null) throw new ApiError(404, 'Registration token not found or expired');

    // 3. Get user document
    const email = getHash().update(attestationPostRequest.value.email).digest('hex');
    const userDoc = await User.findOne({ email });
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

      // 7. Make user to admin if it is the inital admin
      if (!registrationTokenDoc.userIsDeletable) userDoc.roles.push(Roles.ADMIN);

      // 8. Delete registration token
      registrationTokenDoc.delete();

      // 9. Send jwt to user
      const jwtPayload = {
        email: attestationPostRequest.value.email,
        roles: userDoc.roles,
      }

      // 10. Done
      const response = new ApiSuccess(200, { 'accesstoken': generateJWToken(jwtPayload) });
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
