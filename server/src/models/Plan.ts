import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlan extends Document {
  planId: string;
  name: string;
  price: string;
  monthlyAmount: number;
  durationDays: number;
  durationLabel: string;
  specs: string;
  quality: string;
  resolution: string;
  screens: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: String,
      required: true,
    },
    monthlyAmount: {
      type: Number,
      required: true,
    },
    durationDays: {
      type: Number,
      default: 30,
    },
    durationLabel: {
      type: String,
      default: '1 Month (30 Days)',
    },
    specs: {
      type: String,
      required: true,
    },
    quality: {
      type: String,
      default: 'Great',
    },
    resolution: {
      type: String,
      default: '1080p Full HD',
    },
    screens: {
      type: String,
      default: '2 Screens at once',
    },
    features: {
      type: [String],
      default: [],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = obj.planId || obj._id;
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  }
);

export const Plan: Model<IPlan> = mongoose.model<IPlan>('Plan', planSchema);
