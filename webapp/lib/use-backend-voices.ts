import { useState, useEffect } from "react";

export function useBackendVoices(url: string, intervalMs: number = 60000) {
  const [voices, setVoices] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchVoices = () => {
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const list: string[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.voices)
              ? data.voices
              : [];
          if (isMounted) setVoices(list);
        })
        .catch((error) => {
          console.error("Error fetching backend voices:", error);
        });
    };

    fetchVoices();
    const id = setInterval(fetchVoices, intervalMs);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [url, intervalMs]);

  return voices;
}

