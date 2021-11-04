import { object } from "joi";
import { ApiError } from "../../error.class";
import { ApiSuccess } from "../../success.class";
import { loggerFile } from "../../../configuration/logger";
import { config } from "../../../configuration/environment";
import { userUsernameValidationSchema, User } from "../../../schemas/user.schema";
import { Request, Response, NextFunction } from 'express';
import { RegistrationToken, registrationTokenValidationSchema } from "../../../schemas/registrationToken.schema";
import { GenerateRegistrationOptionsOpts, generateRegistrationOptions } from '@simplewebauthn/server';

/**
 * User Input Validation
 */
const authAttestationGetRequestSchema = object({
  username: userUsernameValidationSchema,
  token: registrationTokenValidationSchema,
});

/**
 * GET /authentication/register
 *
 * Handles requests to create a new challenge that is required
 * to register a new device.
 *
 * Expect: token and username parameter
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
 export async function authAttestationGetRequest(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    // 1. Validate user input
    const attestationGetRequest = authAttestationGetRequestSchema.validate(req.query);
    if (attestationGetRequest.error) throw new ApiError(400, attestationGetRequest.error.message);

    // 2. Validate registration token
    const registrationTokenDoc = await RegistrationToken.findOne({ 'key': attestationGetRequest.value.token });
    if (registrationTokenDoc === null) throw new ApiError(404, 'Registration token not found or expired');

    // 3. Get user document; create if it does not exist
    const userDoc = await User.findOneAndUpdate({ username: attestationGetRequest.value.username }, {}, { upsert: true, new: true });
    if (userDoc.device) throw new ApiError(403, 'User already registered');

    // 4. Create attestation challenge
    const attestationOptionsOpts: GenerateRegistrationOptionsOpts = {
      rpName: config.rp.name,
      rpID: config.rp.id,
      userID: userDoc._id,
      userName: userDoc.username.toString(),
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
