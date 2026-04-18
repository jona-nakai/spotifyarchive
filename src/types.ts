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
})

export type SpotifyJsonType = z.infer<typeof SpotifyJson>
