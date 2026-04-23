import { useState, useEffect } from 'react';
import { getTotalStats } from '../db/db';

function Stats() {
  const [totalStats, setTotalStats] = useState<{ count: number, total_ms_played: number}| null>(null);
  useEffect(() => { getTotalStats().then(data => setTotalStats(data)) }, []);

  return (
    <>
      {totalStats === null ? <div>loading</div> : <div>Total songs played: {totalStats.count}</div>}
      {totalStats === null ? <div>loading</div> : <div>Milliseconds played: {totalStats.total_ms_played}</div>}
      {totalStats === null ? <div>loading</div> : <div>Seconds played: {(totalStats.total_ms_played / 1000).toFixed(3)}</div>}
      {totalStats === null ? <div>loading</div> : <div>Minutes played: {(totalStats.total_ms_played / 60000).toFixed(3)}</div>}
      {totalStats === null ? <div>loading</div> : <div>Hours played: {(totalStats.total_ms_played / 3600000).toFixed(3)}</div>}
      {totalStats === null ? <div>loading</div> : <div>Days played: {(totalStats.total_ms_played / 86400000).toFixed(3)}</div>}
    </> 
  )
}

export default Stats
