import { useState, useEffect } from 'react';
import { getTotalStats } from '../db/db';

function Stats() {
  const [totalStats, setTotalStats] = useState<{ count: number, total_ms_played: number}| null>(null);
  useEffect(() => { getTotalStats().then(data => setTotalStats(data)) }, []);

  return (
    <>
      {totalStats === null ? <div>loading</div> : <div>{totalStats.count}</div>}
      {totalStats === null ? <div>loading</div> : <div>{totalStats.total_ms_played}</div>}
    </> 
  )
}

export default Stats
