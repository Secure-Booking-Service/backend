/* eslint @typescript-eslint/no-explicit-any:0 */
import { Schema, model, Model, Document } from 'mongoose';
import { IAuthenticatorDocument, authenticatorSchema } from './authenticator.schema';
import { Roles } from '../roles';
import {  } from 'mongoose-encryption';
import Joi from 'joi';

export interface IUserDocument extends Document {
  [_id: string]: any;
  email: string;
  createdAt: Date;
  deletable: boolean;
  currentChallenge?: string;
  device: IAuthenticatorDocument;
  roles: Roles[]
}

const UserSchema = new Schema({
  email: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  deletable: { type: Boolean, default: true },
  currentChallenge: { type: String, default: null },
  device: { type: authenticatorSchema, default: null },
  roles: { type: Array, default: [] }
});

UserSchema.plugin()

export const User: Model<IUserDocument> = model<IUserDocument>('User', UserSchema);

export const userUsernameValidationSchema = Joi.string().required().email().description('Username of User');
