// hooks/useMarketSummary.js
import { useState, useEffect } from "react";

export default function useMarketSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("/api/market-summary")
      .then(res => res.json())
      .then(setSummary);
  }, []);

  return summary;
}
