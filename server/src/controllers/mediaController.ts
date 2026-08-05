import { Request, Response, NextFunction } from 'express';
import { Media, IMedia } from '../models/Media.js';
import { env } from '../config/env.js';

// Fallback catalog in case TMDB or MongoDB is empty
export const FALLBACK_CATALOGUE = [
  { tmdbId: 1, title: 'Dune: Part Two', overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', backdropPath: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', voteAverage: 8.2, releaseDate: '2024-02-27', mediaType: 'movie' as const, genreIds: [878, 12], genres: ['Sci-Fi', 'Adventure'], isFeatured: true, isTrending: true },
  { tmdbId: 2, title: 'Oppenheimer', overview: 'The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.', backdropPath: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', voteAverage: 8.1, releaseDate: '2023-07-19', mediaType: 'movie' as const, genreIds: [18, 36], genres: ['Drama', 'History'], isFeatured: false, isTrending: true },
  { tmdbId: 3, title: 'The Dark Knight', overview: 'Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.', backdropPath: '/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', voteAverage: 8.5, releaseDate: '2008-07-16', mediaType: 'movie' as const, genreIds: [28, 80], genres: ['Action', 'Crime'], isFeatured: false, isTrending: true },
  { tmdbId: 4, title: 'Stranger Things', overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.', backdropPath: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg', posterPath: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', voteAverage: 8.6, firstAirDate: '2016-07-15', mediaType: 'tv' as const, genreIds: [18, 9648], genres: ['Drama', 'Mystery'], isFeatured: false, isTrending: true },
  { tmdbId: 5, title: 'Wednesday', overview: 'Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.', backdropPath: '/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg', posterPath: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg', voteAverage: 8.4, firstAirDate: '2022-11-23', mediaType: 'tv' as const, genreIds: [35, 9648], genres: ['Comedy', 'Fantasy'], isFeatured: false, isTrending: true },
  { tmdbId: 6, title: 'Blade Runner 2049', overview: 'A young blade runner unearths a long-buried secret that leads him to track down a former LAPD officer.', backdropPath: '/ilRyazdMJwN05exqhwK4tMKBYZs.jpg', posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', voteAverage: 7.6, releaseDate: '2017-10-04', mediaType: 'movie' as const, genreIds: [878, 18], genres: ['Sci-Fi', 'Drama'], isFeatured: false, isTrending: false },
  { tmdbId: 7, title: 'The Last of Us', overview: 'A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.', backdropPath: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg', posterPath: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', voteAverage: 8.6, firstAirDate: '2023-01-15', mediaType: 'tv' as const, genreIds: [18, 10759], genres: ['Drama', 'Action'], isFeatured: false, isTrending: true },
  { tmdbId: 8, title: 'Interstellar', overview: 'Explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', backdropPath: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', voteAverage: 8.4, releaseDate: '2014-11-05', mediaType: 'movie' as const, genreIds: [12, 18, 878], genres: ['Sci-Fi', 'Adventure'], isFeatured: false, isTrending: false },
  { tmdbId: 9, title: 'Arcane', overview: 'Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic and technology.', backdropPath: '/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg', posterPath: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg', voteAverage: 8.7, firstAirDate: '2021-11-06', mediaType: 'tv' as const, genreIds: [16, 10759], genres: ['Animation', 'Sci-Fi'], isFeatured: false, isTrending: true },
  { tmdbId: 10, title: 'Mad Max: Fury Road', overview: 'In a ruined wasteland, Max joins a rebel warrior fleeing a tyrant and his army in a roaring war rig.', backdropPath: '/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg', posterPath: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg', voteAverage: 7.6, releaseDate: '2015-05-13', mediaType: 'movie' as const, genreIds: [28, 12], genres: ['Action', 'Adventure'], isFeatured: false, isTrending: false },
  { tmdbId: 11, title: 'The Bear', overview: 'A young chef returns home to run his family\'s sandwich shop and transform its chaotic kitchen.', backdropPath: '/ySRAQdbALRr5G5YVgR3SsjcJtLw.jpg', posterPath: '/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg', voteAverage: 8.2, firstAirDate: '2022-06-23', mediaType: 'tv' as const, genreIds: [18, 35], genres: ['Drama', 'Comedy'], isFeatured: false, isTrending: true },
  { tmdbId: 12, title: 'Planet Earth III', overview: 'Extraordinary stories from the natural world reveal the beauty and fragility of life on Earth.', backdropPath: '/7k3wAa6W0N0W5LYj7ZQhZQNWwH8.jpg', posterPath: '/2yfz0ZSgZQXWW8YpYhY4emTuW4q.jpg', voteAverage: 9.0, firstAirDate: '2023-10-22', mediaType: 'tv' as const, genreIds: [99], genres: ['Documentary'], isFeatured: false, isTrending: false },
];

const CATEGORIES = [
  { title: 'Trending Now', endpoint: '/trending/all/week' },
  { title: 'Top Rated', endpoint: '/movie/top_rated' },
  { title: 'Action Thrillers', endpoint: '/discover/movie?with_genres=28,53' },
  { title: 'Comedic Hits', endpoint: '/discover/movie?with_genres=35' },
  { title: 'Horror Movies', endpoint: '/discover/movie?with_genres=27' },
  { title: 'Documentaries', endpoint: '/discover/movie?with_genres=99' },
];

// Helper to query TMDB API if key exists
async function fetchFromTMDB(endpoint: string): Promise<Record<string, unknown>[] | null> {
  const token = env.TMDB_ACCESS_TOKEN;
  const key = env.TMDB_API_KEY;
  if (!token && !key) return null;

  try {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3${endpoint}${key ? `${separator}api_key=${key}` : ''}`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: Record<string, unknown>[] };
    return json.results || null;
  } catch {
    return null;
  }
}

export const getBrowseData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Try to fetch from DB
    let dbItems = await Media.find().lean();

    // If DB is empty, seed with fallback catalogue
    if (dbItems.length === 0) {
      await Media.insertMany(FALLBACK_CATALOGUE);
      dbItems = await Media.find().lean();
    }

    // Check if TMDB API is available for fresh live data
    const categoryRows = await Promise.all(
      CATEGORIES.map(async (cat, idx) => {
        const tmdbResults = await fetchFromTMDB(cat.endpoint);
        if (tmdbResults && tmdbResults.length > 0) {
          const items = tmdbResults
            .filter((item) => item.backdrop_path)
            .map((item) => ({
              id: item.id,
              tmdbId: item.id,
              title: item.title || item.name || 'Untitled',
              overview: item.overview || '',
              backdrop_path: item.backdrop_path,
              poster_path: item.poster_path,
              vote_average: item.vote_average || 0,
              release_date: item.release_date,
              first_air_date: item.first_air_date,
              media_type: item.media_type || 'movie',
              genre_ids: item.genre_ids || [],
            }));
          return { title: cat.title, items: items.slice(0, 18) };
        }

        // Fallback to DB items sliced differently per row
        const sliced = [...dbItems, ...dbItems].slice(idx, idx + 12).map((item) => ({
          id: item.tmdbId,
          tmdbId: item.tmdbId,
          title: item.title,
          overview: item.overview,
          backdrop_path: item.backdropPath,
          poster_path: item.posterPath,
          vote_average: item.voteAverage,
          release_date: item.releaseDate,
          first_air_date: item.firstAirDate,
          media_type: item.mediaType,
          genre_ids: item.genreIds,
        }));
        return { title: cat.title, items: sliced };
      })
    );

    const featuredItem = categoryRows[0]?.items[0] || {
      id: dbItems[0]?.tmdbId || 1,
      title: dbItems[0]?.title || 'Dune: Part Two',
      overview: dbItems[0]?.overview || 'Paul Atreides unites with Chani...',
      backdrop_path: dbItems[0]?.backdropPath || '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
      poster_path: dbItems[0]?.posterPath || '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      vote_average: dbItems[0]?.voteAverage || 8.2,
      genre_ids: [878, 12],
    };

    res.status(200).json({
      status: 'success',
      data: {
        featured: featuredItem,
        rows: categoryRows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawQ = req.query.q;
    const query = (Array.isArray(rawQ) ? String(rawQ[0]) : String(rawQ || '')).trim();
    if (!query) {
      res.status(200).json({ status: 'success', data: { results: [] } });
      return;
    }

    // Try TMDB live search first if available
    const tmdbResults = await fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
    if (tmdbResults && tmdbResults.length > 0) {
      const formatted = tmdbResults
        .filter((item) => item.backdrop_path || item.poster_path)
        .map((item) => ({
          id: item.id,
          title: item.title || item.name || 'Untitled',
          overview: item.overview || '',
          backdrop_path: item.backdrop_path,
          poster_path: item.poster_path,
          vote_average: item.vote_average || 0,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          media_type: item.media_type || 'movie',
          genre_ids: item.genre_ids || [],
        }));

      res.status(200).json({ status: 'success', data: { results: formatted } });
      return;
    }

    // DB Regex Search Fallback
    const regex = new RegExp(query, 'i');
    const items = await Media.find({
      $or: [{ title: regex }, { overview: regex }, { genres: regex }],
    }).lean();

    const formatted = items.map((item) => ({
      id: item.tmdbId,
      title: item.title,
      overview: item.overview,
      backdrop_path: item.backdropPath,
      poster_path: item.posterPath,
      vote_average: item.voteAverage,
      release_date: item.releaseDate,
      first_air_date: item.firstAirDate,
      media_type: item.mediaType,
      genre_ids: item.genreIds,
    }));

    res.status(200).json({ status: 'success', data: { results: formatted } });
  } catch (error) {
    next(error);
  }
};

export const getMediaDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, id } = req.params;
    const numericId = parseInt(String(id), 10);

    // Try TMDB live details
    const tmdbData = (await fetchFromTMDB(`/${type}/${id}?append_to_response=videos,similar`)) as Record<string, unknown> | null;
    if (tmdbData) {
      res.status(200).json({ status: 'success', data: tmdbData });
      return;
    }

    // DB fallback
    const item = await Media.findOne({ tmdbId: numericId });
    res.status(200).json({
      status: 'success',
      data: item || FALLBACK_CATALOGUE.find((f) => f.tmdbId === numericId) || FALLBACK_CATALOGUE[0],
    });
  } catch (error) {
    next(error);
  }
};
