import { openDB } from 'idb';

import type { SpotifyJsonType } from './types';

export async function connectDB() {
  const database = await openDB('spotify-archive', 1, {
    upgrade(db) {
      db.createObjectStore('audio', { autoIncrement: true });
      db.createObjectStore('video', { autoIncrement: true });
      db.createObjectStore('audiobook', { autoIncrement: true });
    }
  })

  return database
}

export async function saveRecords(records: SpotifyJsonType[]) {
  const db = await connectDB();
  const audioTx = db.transaction('audio', 'readwrite');
  const videoTx = db.transaction('video', 'readwrite');
  const audiobookTx = db.transaction('audiobook', 'readwrite');

  audioTx.store.clear();
  videoTx.store.clear();
  audiobookTx.store.clear();

  const promises: Promise<IDBValidKey>[] = [];
  for (const record of records) {
    if (record.spotify_track_uri) {
      promises.push(audioTx.store.add(record));
    } else if (record.spotify_episode_uri) {
      promises.push(videoTx.store.add(record));
    } else if (record.audiobook_uri) {
      promises.push(audiobookTx.store.add(record));
    }
  } 
  
  await Promise.all([...promises, audioTx.done, videoTx.done, audiobookTx.done])
}

export async function hasRecords() {
  const db = await connectDB();
  const audio_count: number = await db.count('audio');
  const video_count: number = await db.count('video');
  const audiobook_count: number = await db.count('audiobook');

  if (audio_count + video_count + audiobook_count > 0) {
    return true
  } else {
    return false
  }
}
