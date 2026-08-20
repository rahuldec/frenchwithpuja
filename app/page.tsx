"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Video = {
  topic: string;
  link: string;
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVideos = useCallback(async () => {
    try {
      setError("");
      const response = await fetch("/api/videos", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load recordings.");
      }

      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load recordings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
    const interval = window.setInterval(loadVideos, 60_000);
    return () => window.clearInterval(interval);
  }, [loadVideos]);

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return videos;
    return videos.filter((video) => video.topic.toLowerCase().includes(term));
  }, [search, videos]);

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="logo">F</div>
            <div>
              <div className="brand-title">French with Puja</div>
              <div className="brand-subtitle">Class recordings</div>
            </div>
          </div>
          <button className="refresh" onClick={loadVideos} type="button">
            Refresh
          </button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div>
            <p className="eyebrow">French lessons</p>
            <h1>Watch your class recordings.</h1>
            <p className="hero-copy">
              All recorded sessions in one place. New recordings appear here automatically when they are added to the class sheet.
            </p>
          </div>
          <input
            className="search"
            type="search"
            placeholder="Search topics…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search recordings"
          />
        </section>

        <div className="toolbar">
          <span className="count">
            {loading ? "Loading recordings…" : `${filteredVideos.length} recording${filteredVideos.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {loading && <div className="state">Loading your recordings…</div>}

        {!loading && error && (
          <div className="state error">
            {error}
            <br />
            <button className="refresh" onClick={loadVideos} type="button" style={{ marginTop: 14 }}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredVideos.length === 0 && (
          <div className="state">
            {search ? "No recordings match your search." : "No recordings have been added yet."}
          </div>
        )}

        {!loading && !error && filteredVideos.length > 0 && (
          <section className="grid" aria-label="Class recordings">
            {filteredVideos.map((video, index) => (
              <article className="card" key={`${video.link}-${index}`}>
                <div className="player">
                  <iframe
                    src={video.link}
                    title={video.topic}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
                <div className="card-body">
                  <h2 className="topic">{video.topic}</h2>
                  <a className="watch" href={video.link} target="_blank" rel="noreferrer">
                    Open recording ↗
                  </a>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <footer className="footer">French with Puja</footer>
    </div>
  );
}
