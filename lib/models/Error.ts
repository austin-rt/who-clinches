import mongoose, { Schema, Document } from 'mongoose';
import { ErrorLogFields } from '../api-types';

export interface IError extends Document, ErrorLogFields {}

const ErrorSchema = new Schema<IError>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    error: {
      type: String,
      required: true,
    },
    stackTrace: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Error || mongoose.model<IError>('Error', ErrorSchema);
