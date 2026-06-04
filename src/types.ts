import { z } from "zod";

export const SpotifyJson = z.object({
  ts: z.string(),
  platform: z.string(),
  ms_played: z.number(),
  conn_country: z.string(),
  ip_addr: z.string(),
  master_metadata_track_name: z.string().nullable(),
  master_metadata_album_artist_name: z.string().nullable(),
  master_metadata_album_album_name: z.string().nullable(),
  spotify_track_uri: z.string().nullable(),
  episode_name: z.string().nullable(),
  episode_show_name: z.string().nullable(),
  spotify_episode_uri: z.string().nullable(),
  audiobook_title: z.string().nullable(),
  audiobook_uri: z.string().nullable(),
  audiobook_chapter_uri: z.string().nullable(),
  audiobook_chapter_title: z.string().nullable(),
  reason_start: z.string().nullable(),
  reason_end: z.string().nullable(),
  shuffle: z.boolean(),
  skipped: z.boolean(),
  offline: z.boolean().nullable(),
  offline_timestamp: z.number().nullable(),
  incognito_mode: z.boolean()
});

export type SpotifyJsonType = z.infer<typeof SpotifyJson>;

export type PlayRecord = {
  ts: string;
  msPlayed: number;
  connCountry: string;

  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;

  reasonStart: string | null;
  reasonEnd: string | null;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean | null;
  offlineTimestamp: number | null;
  incognitoMode: boolean;
};

export type TrackRecord = {
  id: string;
  artistIds: string[];
  albumId: string;

  name: string;
  spotifyUrl: string;

  durationMs: number;
  explicit: boolean;
  popularity: number;
  discNumber: number;
  trackNumber: number;
};

export type ArtistRecord = {
  id: string;

  name: string;
  spotifyUrl: string;
};

export type AlbumImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type AlbumRecord = {
  id: string;
  artistIds: string[];

  name: string;
  spotifyUrl: string;
  images: AlbumImage[];

  albumType: "album" | "single" | "compilation";
  totalTracks: number;
  releaseDate: string;
  releaseDatePrecision: "year" | "month" | "day";
};

export type SpotifyTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};
