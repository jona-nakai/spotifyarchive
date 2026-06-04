import { openDB } from "idb";
import type { 
  SpotifyJsonType,
  PlayRecord,
  TrackRecord,
  ArtistRecord,
  AlbumRecord,
  SpotifyTokenResponse
} from "./types";
import { fetchSpotifyTracks } from "./spotify";

async function connectDB() {
  const database = await openDB("spotify-archive", 1, {
    upgrade(db) {
      const playsStore = db.createObjectStore("plays", {
        keyPath: "id",
        autoIncrement: true,
      });
      playsStore.createIndex("ts", "ts");

      db.createObjectStore("tracks", { keyPath: "id" });
      db.createObjectStore("artists", { keyPath: "id" });
      db.createObjectStore("albums", { keyPath: "id" });
      db.createObjectStore("metadata", { keyPath: "key" });
      db.createObjectStore("spotify_auth", { keyPath: "key" });
    }
  })

  return database
}

export async function saveSpotifyToken(token: SpotifyTokenResponse) {
  const db = await connectDB();

  await db.put("spotify_auth", {
    key: "token",
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    tokenType: token.token_type,
    scope: token.scope ?? "",
    expiresAt: Date.now() + token.expires_in * 1000,
  })
}

export async function getSpotifyToken() {
  const db = await connectDB();
  const token = await db.get("spotify_auth", "token");
  return token;
}

export async function saveRecords(records: SpotifyJsonType[], isCanceled: () => boolean): Promise<boolean> {
  const db = await connectDB();
  if (isCanceled()) return false;

  await db.put("metadata", {
    key: "uploadStatus",
    complete: false
  });
  if (isCanceled()) return false;

  const playsTx = db.transaction("plays", "readwrite");
  playsTx.store.clear();

  const trackIds = new Set<string>();
  
  for (const play of records) {
    if (isCanceled()) {
      playsTx.abort();
      return false;
    }

    // Filter out podcasts and audiobooks
    if (
      !play.spotify_track_uri ||
      !play.master_metadata_track_name ||
      !play.master_metadata_album_artist_name ||
      !play.master_metadata_album_album_name
    ) {
      continue;
    }

    const trackId = play.spotify_track_uri.split(":")[2];
    trackIds.add(trackId);

    const playRecord: PlayRecord = {
      ts: play.ts,
      msPlayed: play.ms_played,
      connCountry: play.conn_country,
      trackId,
      trackName: play.master_metadata_track_name,
      artistName: play.master_metadata_album_artist_name,
      albumName: play.master_metadata_album_album_name,
      reasonStart: play.reason_start,
      reasonEnd: play.reason_end,
      shuffle: play.shuffle,
      skipped: play.skipped,
      offline: play.offline,
      offlineTimestamp: play.offline_timestamp,
      incognitoMode: play.incognito_mode,
    };

    playsTx.store.add(playRecord);
  }

  await playsTx.done;

  // spotify web api
  const trackIdsArray = [...trackIds];

  const spotifyToken = await getSpotifyToken();
  if (!spotifyToken) {
    throw new Error("Missing Spotify Access Token");
  };

  for (let i = 0; i < trackIdsArray.length; i += 50) {
    if (isCanceled()) return false;
    const batch = trackIdsArray.slice(i, i + 50);
    const spotifyTracks = await fetchSpotifyTracks(batch, spotifyToken.accessToken);

    if (isCanceled()) return false;

    const tx = db.transaction(["tracks", "albums", "artists"], "readwrite");

    const tracksStore = tx.objectStore("tracks");
    const albumsStore = tx.objectStore("albums");
    const artistsStore = tx.objectStore("artists");
    
    for (const spotifyTrack of spotifyTracks) {
      if (isCanceled()) {
        tx.abort();
        return false;
      }

      // store track
      const trackArtists = spotifyTrack.artists;
      const artistIds: string[] = [];
      for (const trackArtist of trackArtists) {
        artistIds.push(trackArtist.id)
      }

      const trackRecord: TrackRecord = {
        id: spotifyTrack.id,
        artistIds,
        albumId: spotifyTrack.album.id,

        name: spotifyTrack.name,
        spotifyUrl: spotifyTrack.external_urls.spotify,

        durationMs: spotifyTrack.duration_ms,
        explicit: spotifyTrack.explicit,
        popularity: spotifyTrack.popularity,
        discNumber: spotifyTrack.disc_number,
        trackNumber: spotifyTrack.track_number
      };

      tracksStore.put(trackRecord);

      // store artists
      for (const trackArtist of trackArtists) { 
        const artistRecord: ArtistRecord = {
          id: trackArtist.id,

          name: trackArtist.name,
          spotifyUrl: trackArtist.external_urls.spotify
        }

        artistsStore.put(artistRecord);
      }

      // store album
      const spotifyAlbum = spotifyTrack.album;

      const albumArtists = spotifyAlbum.artists;
      const albumArtistIds: string[] = [];
      for (const albumArtist of albumArtists) {
        albumArtistIds.push(albumArtist.id)
      }

      const albumRecord: AlbumRecord = {
        id: spotifyAlbum.id,
        artistIds: albumArtistIds,

        name: spotifyAlbum.name,
        spotifyUrl: spotifyAlbum.external_urls.spotify,
        images: spotifyAlbum.images,

        albumType: spotifyAlbum.album_type,
        totalTracks: spotifyAlbum.total_tracks,
        releaseDate: spotifyAlbum.release_date,
        releaseDatePrecision: spotifyAlbum.release_date_precision,
      }

      albumsStore.put(albumRecord);
    }

    await tx.done;
  }


  
  if (isCanceled()) return false;

  await db.put("metadata", {
    key: "uploadStatus",
    complete: true
  });

  return true;
}

export async function hasRecords() {
  const db = await connectDB();
  const metadata= await db.get("metadata", "uploadStatus");
  return metadata?.complete === true;
}

export async function getStore(store: string) {
  const database = await connectDB();
  const tx = database.transaction(store, "readonly");
  const data = await tx.store.getAll();
  return data
}
