import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasRecords, getSpotifyToken } from "../db";

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  async function handleProceedToStats() {
    setChecking(true);

    const completeUpload = await hasRecords();
    const token = await getSpotifyToken();

    const hasNonExpiredToken = token && token.expiresAt > Date.now();

    if (completeUpload && hasNonExpiredToken) {
      navigate("/stats")
    } else {
      navigate("/upload")
    }
  }

  return (
    <>
      <div>temp</div>
      <button onClick={handleProceedToStats} disabled={checking}>
        Explore my Spotify stats!
      </button>
    </>
  );
}