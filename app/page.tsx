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

      if (!response.ok) throw new Error(data?.error || "Unable to load recordings.");
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
        <div className="tricolor" aria-hidden="true"><span /><span /><span /></div>
        <div className="header-inner">
          <div className="brand">
            <div className="logo"><span>F</span></div>
            <div>
              <div className="brand-title">French with Puja</div>
              <div className="brand-subtitle">Apprendre · Pratiquer · Progresser</div>
            </div>
          </div>
          <button className="refresh" onClick={loadVideos} type="button">
            ↻ <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div className="hero-copy-wrap">
            <div className="eyebrow"><span className="flag-dot" /> French lessons</div>
            <h1>Bienvenue.<br /><em>Let’s learn French.</em></h1>
            <p className="hero-copy">
              Your class recordings, beautifully organised in one place. New lessons appear automatically as they are added by your teacher.
            </p>
            <div className="hero-note"><span>🇫🇷</span> Learn at your own pace · Rewatch anytime</div>
          </div>
          <div className="search-card">
            <div className="search-label">Find a lesson</div>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search"
                type="search"
                placeholder="Search by topic…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search recordings"
              />
              {search && <button className="clear-search" onClick={() => setSearch("")} type="button" aria-label="Clear search">×</button>}
            </div>
            <div className="search-hint">Try “verbs”, “words”, or any lesson topic</div>
          </div>
        </section>

        <div className="section-heading">
          <div>
            <span className="section-kicker">La bibliothèque</span>
            <h2>Your recordings</h2>
          </div>
          <div className="count-pill">
            <span className="count-dot" />
            {loading ? "Loading…" : `${filteredVideos.length} lesson${filteredVideos.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {loading && <div className="state"><div className="loader" /><strong>Preparing your lessons…</strong><span>Un instant, s’il vous plaît.</span></div>}

        {!loading && error && (
          <div className="state error">
            <strong>Something went wrong.</strong>
            <span>{error}</span>
            <button className="try-again" onClick={loadVideos} type="button">Try again</button>
          </div>
        )}

        {!loading && !error && filteredVideos.length === 0 && (
          <div className="state"><div className="empty-icon">F</div><strong>{search ? "Aucun résultat." : "No recordings yet."}</strong><span>{search ? "Try another topic." : "Your teacher’s recordings will appear here."}</span></div>
        )}

        {!loading && !error && filteredVideos.length > 0 && (
          <section className="grid" aria-label="Class recordings">
            {filteredVideos.map((video, index) => (
              <article className="card" key={`${video.link}-${index}`}>
                <a
                  className={`generated-thumbnail thumbnail-${index % 3}`}
                  href={video.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Watch ${video.topic}`}
                >
                  <div className="thumbnail-accent" aria-hidden="true"><span /><span /><span /></div>
                  <div className="thumbnail-topline">FRENCH WITH PUJA <span>·</span> RECORDED CLASS</div>
                  <div className="thumbnail-content">
                    <span className="thumbnail-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="thumbnail-label">LEÇON DU JOUR</span>
                    <strong>{video.topic}</strong>
                  </div>
                  <div className="thumbnail-bottom">
                    <span className="thumbnail-brand">Apprendre · Pratiquer · Progresser</span>
                    <span className="thumbnail-play">▶</span>
                  </div>
                  <div className="thumbnail-french-mark" aria-hidden="true">F</div>
                </a>
                <div className="card-body">
                  <div className="lesson-meta"><span className="lesson-number">{String(index + 1).padStart(2, "0")}</span><span>RECORDED LESSON</span></div>
                  <h2 className="topic">{video.topic}</h2>
                  <a className="watch" href={video.link} target="_blank" rel="noreferrer">
                    <span className="play-icon">▶</span> Watch recording <span className="arrow">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <footer className="footer"><span className="footer-mark">F</span><span>French with Puja</span><span className="footer-separator">·</span><span>À bientôt!</span></footer>
    </div>
  );
}
