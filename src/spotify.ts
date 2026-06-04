export type SpotifyApiArtist = {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
};

export type SpotifyApiAlbum = {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  images: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  album_type: "album" | "single" | "compilation";
  total_tracks: number;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  artists: SpotifyApiArtist[];
};

export type SpotifyApiTrack = {
  id: string;
  name: string;
  artists: SpotifyApiArtist[];
  album: SpotifyApiAlbum;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  disc_number: number;
  track_number: number;
};

type SpotifyTracksResponse = {
  tracks: SpotifyApiTrack[];
};

function generateCodeVerifier(length: number) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let text = "";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function redirectToSpotifyAuth() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Missing Spotify auth environment variables");
  }

  const codeVerifier = generateCodeVerifier(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  window.localStorage.setItem("spotify_code_verifier", codeVerifier);

  const authUrl = new URL("https://accounts.spotify.com/authorize");

  authUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: "",
  }).toString();

  window.location.href = authUrl.toString();
}

export async function exchangeSpotifyCodeForToken(code: string) {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const codeVerifier = window.localStorage.getItem("spotify_code_verifier");

  if (!clientId || !redirectUri) {
    throw new Error("Missing Spotify auth environment variables");
  }

  if (!codeVerifier) {
    throw new Error("Missing Spotify code verifier");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.status}`);
  }

  return response.json();
}

export class SpotifyUnauthorizedError extends Error {
  constructor() {
    super("Spotify access token expired or invalid");
  }
}

export class SpotifyRateLimitError extends Error {
  retryAfter: number | null;

  constructor(retryAfter: number | null) {
    super("Spotify rate limit exceeded");
    this.retryAfter = retryAfter;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSpotifyTracks(
  trackIds: string[],
  accessToken: string,
  retriesLeft = 3
): Promise<SpotifyApiTrack[]> {
  const ids = trackIds.join(",");

  const response = await fetch(
    `https://api.spotify.com/v1/tracks?ids=${encodeURIComponent(ids)}&market=US`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 401) {
    throw new SpotifyUnauthorizedError();
  }

  if (response.status === 429 && retriesLeft > 0) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? 1);

    await wait(retryAfter * 1000);

    return fetchSpotifyTracks(trackIds, accessToken, retriesLeft - 1);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? 1);

    throw new SpotifyRateLimitError(retryAfter);
  }

  if (!response.ok) {
    throw new Error(`Spotify tracks request failed: ${response.status}`);
  }

  const data: SpotifyTracksResponse = await response.json();
  return data.tracks;
}
