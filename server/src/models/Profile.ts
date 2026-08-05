import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMyListItem {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage?: number;
  addedAt: Date;
}

export interface IWatchHistoryItem {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  progress: number; // seconds
  duration: number; // seconds
  watchedAt: Date;
}

export interface IProfile extends Document {
  user: Types.ObjectId;
  name: string;
  avatar: string;
  face?: string;
  isKids: boolean;
  pin?: string;
  myList: IMyListItem[];
  watchHistory: IWatchHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const myListItemSchema = new Schema<IMyListItem>(
  {
    mediaId: { type: Number, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], default: 'movie' },
    title: { type: String, required: true },
    posterPath: { type: String, default: null },
    backdropPath: { type: String, default: null },
    voteAverage: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const watchHistoryItemSchema = new Schema<IWatchHistoryItem>(
  {
    mediaId: { type: Number, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], default: 'movie' },
    title: { type: String, required: true },
    posterPath: { type: String, default: null },
    backdropPath: { type: String, default: null },
    progress: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    watchedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const profileSchema = new Schema<IProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    avatar: {
      type: String,
      default: 'linear-gradient(135deg,#0072d2,#62d5ff)',
    },
    face: {
      type: String,
      default: '★',
    },
    isKids: {
      type: Boolean,
      default: false,
    },
    pin: {
      type: String,
      maxlength: 4,
    },
    myList: {
      type: [myListItemSchema],
      default: [],
    },
    watchHistory: {
      type: [watchHistoryItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = obj._id;
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  }
);

export const Profile: Model<IProfile> = mongoose.model<IProfile>('Profile', profileSchema);
