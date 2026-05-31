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