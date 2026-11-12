import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import WiserLayout, { Avatar } from "./WiserLayout";
import { AUTHOR, formatDate, usePublishedArticles } from "./articles";

function ArticleCard({ article }) {
  return (
    <article className="wiser-card">
      <div className="wiser-card__byline">
        <Avatar size={20} />
        <span>{AUTHOR}</span>
      </div>
      <Link to={`/wiser/${article.slug}`} className="wiser-card__link">
        <div className="wiser-card__text">
          <h2 className="wiser-card__title">{article.title}</h2>
          {article.subtitle && (
            <p className="wiser-card__subtitle">{article.subtitle}</p>
          )}
        </div>
        {article.cover && (
          <img className="wiser-card__cover" src={article.cover} alt="" />
        )}
      </Link>
      <p className="wiser-meta">
        {formatDate(article.published_at)} · {article.read_time} min read
      </p>
    </article>
  );
}

export default function WiserHome() {
  const { data: articles, error, loading } = usePublishedArticles();
  const [searchParams] = useSearchParams();
  const activeTag = searchParams.get("tag");

  useEffect(() => {
    document.title = "Wiser";
  }, []);

  const tags = [...new Set((articles || []).flatMap((a) => a.tags))].sort();
  const visible = (articles || []).filter(
    (article) => !activeTag || article.tags.includes(activeTag),
  );

  return (
    <WiserLayout>
      <div className="wiser-home">
        <main className="wiser-feed">
          <nav className="wiser-tabs" aria-label="Topics">
            <Link
              to="/wiser"
              className={`wiser-tab ${activeTag ? "" : "wiser-tab--active"}`}
            >
              All
            </Link>
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/wiser?tag=${encodeURIComponent(tag)}`}
                className={`wiser-tab ${
                  tag === activeTag ? "wiser-tab--active" : ""
                }`}
              >
                {tag}
              </Link>
            ))}
          </nav>

          {error && (
            <p className="wiser-status">
              Articles couldn't be loaded. Please refresh the page.
            </p>
          )}
          {loading && <p className="wiser-status">Loading…</p>}
          {articles && visible.length === 0 && (
            <p className="wiser-status">No articles here yet.</p>
          )}
          {visible.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </main>

        <aside className="wiser-sidebar">
          <Avatar size={64} />
          <h2 className="wiser-sidebar__name">{AUTHOR}</h2>
          <p className="wiser-sidebar__bio">Writing on WISER.</p>
        </aside>
      </div>
    </WiserLayout>
  );
}
