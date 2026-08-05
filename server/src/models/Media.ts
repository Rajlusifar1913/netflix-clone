import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  overview: string;
  backdropPath: string | null;
  posterPath: string | null;
  voteAverage: number;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: 'movie' | 'tv';
  genreIds: number[];
  genres?: string[];
  isFeatured: boolean;
  isTrending: boolean;
  category?: string;
  trailerUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalTitle: {
      type: String,
      trim: true,
    },
    overview: {
      type: String,
      required: true,
      default: '',
    },
    backdropPath: {
      type: String,
      default: null,
    },
    posterPath: {
      type: String,
      default: null,
    },
    voteAverage: {
      type: Number,
      default: 0,
    },
    releaseDate: {
      type: String,
    },
    firstAirDate: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ['movie', 'tv'],
      default: 'movie',
      index: true,
    },
    genreIds: {
      type: [Number],
      default: [],
    },
    genres: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      index: true,
    },
    trailerUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = obj.tmdbId || obj._id;
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  }
);

export const Media: Model<IMedia> = mongoose.model<IMedia>('Media', mediaSchema);
