import { openDB } from 'idb';

import type { SpotifyJsonType, AudioTrackRow } from '../types/types';

export async function connectDB() {
  const database = await openDB('spotify-archive', 1, {
    upgrade(db) {
      db.createObjectStore('audio', { autoIncrement: true });
      db.createObjectStore('audio_track', { keyPath: 'uri' });
      db.createObjectStore('audio_artist', { keyPath: 'artist_name' });
      db.createObjectStore('audio_album', { keyPath: 'album_artist' });
    }
  })

  return database
}

export async function saveRecords(records: SpotifyJsonType[]) {
  const db = await connectDB();
  const audioTx = db.transaction('audio', 'readwrite');

  audioTx.store.clear();

  const promises: Promise<IDBValidKey>[] = [];
  for (const record of records) {
    if (record.spotify_track_uri) {
      promises.push(audioTx.store.add(record));
    } 
  } 
  
  await Promise.all([...promises, audioTx.done])
}

export async function hasRecords() {
  const db = await connectDB();
  const audio_count: number = await db.count('audio');

  if (audio_count > 0) {
    return true
  } else {
    return false
  }
}

export async function createAudioStores() {
  const db = await connectDB();
  const tx = db.transaction('audio', 'readonly');
  const rows = await tx.store.getAll();
  
  const trackTx = db.transaction('audio_track', 'readwrite');
  const artistTx = db.transaction('audio_artist', 'readwrite');
  const albumTx = db.transaction('audio_album', 'readwrite');
  
  const promises: Promise<IDBValidKey>[] = [];
  const trackMap = new Map<string, AudioTrackRow>();
  for (const row of rows) {
    // Extract relevant information from each row
    const row_ms_played = row.ms_played;
    const row_track_name = row.master_metadata_track_name;
    const row_artist_name = row.master_metadata_album_artist_name;
    const row_album_name = row.master_metadata_album_album_name;
    const row_uri = row.spotify_track_uri;

    // store tracks
    const current = trackMap.get(row_uri);
    if (current) {
      const current_playcount = current.play_count;
      const current_total_ms = current.total_ms_played;
      trackMap.set(row_uri, { 
        track_name: row_track_name, 
        play_count: current_playcount + 1, 
        total_ms_played: current_total_ms + row_ms_played})
    } else {
      trackMap.set(row_uri, {
        track_name: row_track_name,
        play_count: 1,
        total_ms_played: row_ms_played
      })
    }

    // store artists
    
  }
}
