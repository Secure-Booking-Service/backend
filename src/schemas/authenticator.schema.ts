/* eslint @typescript-eslint/no-explicit-any:0 */
import { Schema, Document } from 'mongoose';
import { defaultEncryption } from '../database.encryption';
import encryption from 'mongoose-encryption';

export interface IAuthenticatorDocument extends Document {
  [_id: string]: any;
  credentialID: Buffer;
  credentialPublicKey: Buffer;
  counter: number;
  transports?: AuthenticatorTransport[];
}

export const authenticatorSchema = new Schema({
  credentialID: { type: Buffer, required: true },
  credentialPublicKey: { type: Buffer, required: true },
  counter: { type: Number, required: true },
  transports: Array,
});

authenticatorSchema.plugin(encryption, defaultEncryption );
