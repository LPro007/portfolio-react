import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WiserLayout from "./WiserLayout";
import { deleteArticle, formatDate, useStories } from "./articles";

export default function StoriesPage() {
  const { data: stories, error, loading, reload } = useStories();
  const [tab, setTab] = useState("drafts");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    document.title = "Your stories | Wiser";
  }, []);

  const drafts = (stories || []).filter((story) => !story.published_at);
  const published = (stories || []).filter((story) => story.published_at);
  const visible = tab === "drafts" ? drafts : published;

  const remove = async (story) => {
    if (!window.confirm(`Delete "${story.title || "Untitled"}"? This can't be undone.`)) {
      return;
    }
    setDeleteError("");
    try {
      await deleteArticle(story.id);
      reload();
    } catch {
      setDeleteError("That story couldn't be deleted. Please try again.");
    }
  };

  const tabButton = (name, label, count) => (
    <button
      type="button"
      className={`wiser-tab ${tab === name ? "wiser-tab--active" : ""}`}
      onClick={() => setTab(name)}
    >
      {label} {count}
    </button>
  );

  return (
    <WiserLayout>
      <main className="wiser-stories">
        <div className="wiser-stories__top">
          <h1 className="wiser-stories__title">Your stories</h1>
          <Link to="/wiser/new" className="wiser-button">
            Write a story
          </Link>
        </div>
        <nav className="wiser-tabs">
          {tabButton("drafts", "Drafts", drafts.length)}
          {tabButton("published", "Published", published.length)}
        </nav>

        {error && (
          <p className="wiser-status">
            Your stories couldn't be loaded. Please refresh the page.
          </p>
        )}
        {deleteError && (
          <p className="wiser-error" role="alert">
            {deleteError}
          </p>
        )}
        {loading && <p className="wiser-status">Loading…</p>}
        {stories && visible.length === 0 && (
          <p className="wiser-status">Nothing here yet.</p>
        )}

        {visible.map((story) => (
          <div key={story.id} className="wiser-story">
            <Link to={`/wiser/edit/${story.id}`}>
              <h2 className="wiser-story__title">
                {story.title || "Untitled"}
              </h2>
            </Link>
            <p className="wiser-meta">
              {story.published_at
                ? `Published ${formatDate(story.published_at)}`
                : `Last edited ${formatDate(story.updated_at)}`}{" "}
              · {story.read_time} min read
            </p>
            <div className="wiser-story__actions">
              <Link to={`/wiser/edit/${story.id}`}>Edit</Link>
              {story.published_at && (
                <Link to={`/wiser/${story.slug}`}>View</Link>
              )}
              <button type="button" onClick={() => remove(story)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </main>
    </WiserLayout>
  );
}
