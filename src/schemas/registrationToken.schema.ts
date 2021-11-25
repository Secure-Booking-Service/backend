/* eslint @typescript-eslint/no-explicit-any:0 */
import { config } from '../configuration/environment';
import { Schema, model, Model, Document } from 'mongoose';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import Joi, { CustomHelpers } from 'joi';
import encryption from 'mongoose-encryption';
import { defaultEncryption } from '../database.encryption';

export interface IRegistrationTokenDocument extends Document {
  [_id: string]: any;
  key: string;
  createdAt: Date;
  userIsDeletable: boolean;
}

const registrationTokenSchema = new Schema({
  key: { type: String, default: uuidv4 },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: config.registrationTokenLifetime,
   },
  userIsDeletable: { type: Boolean, default: true },
});

registrationTokenSchema.plugin(encryption, {...defaultEncryption, encryptedFields: [], additionalAuthenticatedFields: ['userIsDeletable', 'key', 'createdAt']})

export const RegistrationToken: Model<IRegistrationTokenDocument> = model<IRegistrationTokenDocument>('RegistrationToken', registrationTokenSchema);

const isUUID = (value: string, helper: CustomHelpers) : any => {
  if (!validateUUID(value)) return helper.error('any.invalid');
  return value;
};

export const registrationTokenValidationSchema = Joi.string().required().custom(isUUID).description('Registration token');
