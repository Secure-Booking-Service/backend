import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { User, userEmailValidationSchema } from '../../schemas/user.schema';
import { Roles } from '@secure-booking-service/common-types/Roles';
import { ApiError } from '../error.class';
import { ApiSuccess } from '../success.class';
import { loggerFile } from '../../configuration/logger';
import { getHash } from '../authentication';

/**
 * User Input Validation
 */
const emailPutRequestHeaderSchema = Joi.object({
  email: userEmailValidationSchema,
}).unknown();

const emailPutRequestBodySchema = Joi.object({
  addRoles: Joi.array().items(Joi.string().valid(...Object.values(Roles))).required(),
  removeRoles: Joi.array().items(Joi.string().valid(...Object.values(Roles))).required(),
});

/****************************************
 *          Endpoint Handlers           *
 * **************************************/


/**
 * PUT /api/user/[email]
 * 
 * Handles requests to update the roles of a given user.
 * 
 * @export
 * @param {Request} req
 * @param {Response} response
 * @param {NextFunction} next
 */
export async function emailPutRequest(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validate email 
    const putRequestHeader = emailPutRequestHeaderSchema.validate(req.params);
    if (putRequestHeader.error) throw new ApiError(400, putRequestHeader.error.message);

    // 2. Validate body
    const putRequestBody = emailPutRequestBodySchema.validate(req.body);
    if (putRequestBody.error) throw new ApiError(400, putRequestBody.error.message);

    // 3. Get user document
    const email = getHash().update(putRequestHeader.value.email).digest('hex');
    const user = await User.findOne({ email });
    if (user === null) throw new ApiError(404, 'User not found');
    
    // 4. Add new roles if needed
    putRequestBody.value.addRoles
      .filter((newRole: Roles) => user.roles.indexOf(newRole) === -1)
      .forEach((newRole: Roles) => user.roles.push(newRole));

    // 5. Remove roles if needed 
    user.roles = user.roles.filter(role => putRequestBody.value.removeRoles.indexOf(role) === -1);

    // 6. Ensure that inital user has always admin rights
    if (!user.deletable && user.roles.indexOf(Roles.ADMIN) === -1) user.roles.push(Roles.ADMIN);

    // 7. Save
    user.save();

    // 8. Done - return roles
    const response = new ApiSuccess(200, user.roles);
    next(response);

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
