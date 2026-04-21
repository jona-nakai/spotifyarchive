import { openDB } from 'idb';

import type { SpotifyJsonType, AudioTrackVals, ArtistTrackVals, AlbumTrackVals } from '../types/types';

async function connectDB() {
  const database = await openDB('spotify-archive', 1, {
    upgrade(db) {
      db.createObjectStore('audio', { autoIncrement: true });
      db.createObjectStore('audio_track', { keyPath: 'track_uri' });
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
   
  const trackMap = new Map<string, AudioTrackVals>();
  const artistMap = new Map<string, ArtistTrackVals>();
  const albumMap = new Map<string, AlbumTrackVals>();
  for (const row of rows) {
    // Extract relevant information from each row
    const row_ms_played = row.ms_played;
    const row_track_name = row.master_metadata_track_name;
    const row_artist_name = row.master_metadata_album_artist_name;
    const row_album_name = row.master_metadata_album_album_name;
    const row_uri = row.spotify_track_uri;

    // map tracks
    const current_track = trackMap.get(row_uri);
    if (current_track) {
      const current_playcount = current_track.play_count;
      const current_total_ms = current_track.total_ms_played;
      trackMap.set(row_uri, { 
        track_name: row_track_name, 
        play_count: current_playcount + 1, 
        total_ms_played: current_total_ms + row_ms_played
      })
    } else {
      trackMap.set(row_uri, {
        track_name: row_track_name,
        play_count: 1,
        total_ms_played: row_ms_played
      })
    }

    // map artists
    const current_artist = artistMap.get(row_artist_name);
    if (current_artist) {
      const current_playcount = current_artist.play_count;
      const current_total_ms = current_artist.total_ms_played;
      artistMap.set(row_artist_name, {
        play_count: current_playcount + 1,
        total_ms_played: current_total_ms + row_ms_played
      })
    } else {
      artistMap.set(row_artist_name, {
        play_count: 1,
        total_ms_played: row_ms_played
      })
    }

    // map album
    const current_album = albumMap.get(`${row_album_name}-${row_artist_name}`);
    if (current_album) {
      const current_playcount = current_album.play_count;
      const current_total_ms = current_album.total_ms_played;
      albumMap.set(`${row_album_name}-${row_artist_name}`, {
        album_name: row_album_name,
        artist_name: row_artist_name,
        play_count: current_playcount + 1,
        total_ms_played: current_total_ms + row_ms_played
      })
    } else {
      albumMap.set(`${row_album_name}-${row_artist_name}`, {
        album_name: row_album_name,
        artist_name: row_artist_name,
        play_count: 1,
        total_ms_played: row_ms_played
      })     
    }
  }

  // add key-value pair to db stores
  const trackTx = db.transaction('audio_track', 'readwrite');
  const artistTx = db.transaction('audio_artist', 'readwrite');
  const albumTx = db.transaction('audio_album', 'readwrite');

  const promises: Promise<IDBValidKey>[] = []; 
  
  // store tracks
  for (const [track_uri, track] of trackMap.entries()) {
    promises.push(trackTx.store.add({ track_uri, ...track }));
  }

  // store artists
  for (const [artist_name, artist] of artistMap.entries()) {
    promises.push(artistTx.store.add({ artist_name, ...artist }));
  }

  // store albums
  for (const [album_artist, album] of albumMap.entries()) {
    promises.push(albumTx.store.add({ album_artist, ...album }));
  }

  await Promise.all([...promises, trackTx.done, artistTx.done, albumTx.done]);
}

export async function getStore(store: string) {
  const database = await connectDB();
  const tx = database.transaction(store, 'readonly');
  const data = await tx.store.getAll();
  return data
}

export async function getTotalStats() {
  const database = await connectDB();
  const tx = database.transaction('audio', 'readonly');

  const rows = await tx.store.getAll();

  const stats = { count: 0, total_ms_played: 0 };
   
  for (const row of rows) {
    stats.count = stats.count + 1;
    stats.total_ms_played = stats.total_ms_played + row.ms_played;
  }

  return stats
}
