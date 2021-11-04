/* eslint @typescript-eslint/no-explicit-any:0 */
import { Schema, model, Model, Document } from 'mongoose';
import { IAuthenticatorDocument, authenticatorSchema } from './authenticator.schema';
import { string } from 'joi';

export interface IUserDocument extends Document {
  [_id: string]: any;
  username: string;
  createdAt: Date;
  deletable: boolean;
  currentChallenge?: string;
  device: IAuthenticatorDocument;
}

const UserSchema = new Schema({
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  deletable: { type: Boolean, default: true },
  currentChallenge: { type: String, default: null },
  device: { type: authenticatorSchema, default: null },
});

export const User: Model<IUserDocument> = model<IUserDocument>('User', UserSchema);

export const userUsernameValidationSchema = string().required().email().description('Username of User');
