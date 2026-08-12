import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISubscription {
  status: 'none' | 'active' | 'canceled' | 'past_due' | 'unpaid';
  planId: 'mobile' | 'standard' | 'premium' | 'none';
  planName: string;
  planSpecs: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cardLast4: string;
  cardBrand: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  role: 'user' | 'admin';
  avatar?: string;
  subscription: ISubscription;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    status: {
      type: String,
      enum: ['none', 'active', 'canceled', 'past_due', 'unpaid'],
      default: 'active',
    },
    planId: {
      type: String,
      enum: ['mobile', 'standard', 'premium', 'none'],
      default: 'premium',
    },
    planName: {
      type: String,
      default: 'PREMIUM',
    },
    planSpecs: {
      type: String,
      default: 'Ultra HD 4K + HDR (4 Screens at once)',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    cardLast4: {
      type: String,
      default: '4242',
    },
    cardBrand: {
      type: String,
      default: 'visa',
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days from now
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: 'linear-gradient(135deg,#0072d2,#62d5ff)',
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({
        status: 'active',
        planId: 'premium',
        planName: 'PREMIUM',
        planSpecs: 'Ultra HD 4K + HDR (4 Screens at once)',
        cardLast4: '4242',
        cardBrand: 'visa',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      }),
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj.password;
        delete obj.refreshTokens;
        delete obj.__v;
        obj.id = obj._id;
        delete obj._id;
        return obj;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
