import { useEffect } from "react";
import { exchangeSpotifyCodeForToken } from '../spotify';
import { saveSpotifyToken } from '../db';

export default function Callback() {
  useEffect(() => {
    async function connectSpotify() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        console.error("Spotify authorization error:", error);
        return;
      }

      if (!code) {
        console.error("Missing Spotify authorization code");
        return;
      }

      const token = await exchangeSpotifyCodeForToken(code);
      await saveSpotifyToken(token);
      window.location.replace("/");
    }

    connectSpotify();
  }, [])
  return (


    <>
      <div>Connecting Spotify...</div>
    </>
  )
}