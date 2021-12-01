/* eslint @typescript-eslint/no-explicit-any:0 */
import { Schema, Document, Model, model } from 'mongoose';
import { defaultEncryption } from '../database.encryption';
import { DatabaseBooking as IDatabaseBooking } from '@secure-booking-service/common-types';
import encryption from 'mongoose-encryption';

export interface IBookingDocument extends Document {
  [_id: string]: any;
  record: IDatabaseBooking;
  createdAt: Date;
  createdBy: string;
}

export const bookingSchema = new Schema({
  record: { type: Object, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: { type: String, required: true, index: true },
});

bookingSchema.plugin(encryption, { ...defaultEncryption, excludeFromEncryption: ['createdAt', 'createdBy'], additionalAuthenticatedFields: ['createdAt', 'createdBy']});

export const Booking: Model<IBookingDocument> = model<IBookingDocument>('Booking', bookingSchema);
