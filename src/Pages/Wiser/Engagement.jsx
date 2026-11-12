import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "./WiserLayout";
import { loginPath, useAuth } from "./auth";
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchHearted,
  formatCount,
  formatDate,
  recordView,
  setHeart,
} from "./articles";

const MAX_COMMENT = 2000;

function HeartIcon({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.7 3.8 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.9 1.3-1.8 2.9-2.9 4.9-2.9 3.3 0 5.5 3.2 4.3 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.3-.6L4 20l1.4-3.7C4.5 15 4 13.3 4 11.5 4 7.4 7.6 4 12 4s8 3.4 8 7.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Counts once per browser tab session, so refreshes don't inflate views.
function shouldCountView(articleId) {
  const key = `wiser-viewed-${articleId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked: count it anyway.
  }
  return true;
}

export function useEngagement(article) {
  const { session } = useAuth();
  const userId = session ? session.user.id : null;
  const [views, setViews] = useState(article.views || 0);
  const [hearts, setHearts] = useState(article.hearts_count || 0);
  const [hearted, setHearted] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentsError, setCommentsError] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current || !shouldCountView(article.id)) return;
    counted.current = true;
    setViews((count) => count + 1);
    recordView(article.id).catch(() => setViews((count) => count - 1));
  }, [article.id]);

  useEffect(() => {
    setHearted(false);
    if (!userId) return undefined;
    let cancelled = false;
    fetchHearted(article.id, userId).then(
      (value) => !cancelled && setHearted(value),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [article.id, userId]);

  useEffect(() => {
    let cancelled = false;
    fetchComments(article.id).then(
      (rows) => !cancelled && setComments(rows),
      () => !cancelled && setCommentsError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [article.id]);

  const toggleHeart = async () => {
    const next = !hearted;
    setHearted(next);
    setHearts((count) => count + (next ? 1 : -1));
    try {
      await setHeart(article.id, userId, next);
    } catch {
      setHearted(!next);
      setHearts((count) => count + (next ? -1 : 1));
    }
  };

  return {
    views,
    hearts,
    hearted,
    toggleHeart,
    comments,
    setComments,
    commentsError,
    commentCount: comments ? comments.length : article.comments_count || 0,
  };
}

export function StatsBar({ engagement }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { views, hearts, hearted, toggleHeart, commentCount } = engagement;

  const onHeart = () => {
    if (!session) navigate(loginPath(location.pathname));
    else toggleHeart();
  };

  return (
    <div className="wiser-stats">
      <button
        type="button"
        className={`wiser-stats__item ${hearted ? "wiser-stats__item--on" : ""}`}
        aria-pressed={hearted}
        aria-label={hearted ? "Remove heart" : "Heart this story"}
        onClick={onHeart}
      >
        <HeartIcon filled={hearted} />
        <span>{formatCount(hearts)}</span>
      </button>
      <a
        href="#responses"
        className="wiser-stats__item"
        aria-label={`${commentCount} comments`}
        onClick={(event) => {
          event.preventDefault();
          document
            .getElementById("responses")
            .scrollIntoView({ behavior: "smooth" });
        }}
      >
        <CommentIcon />
        <span>{formatCount(commentCount)}</span>
      </a>
      <span className="wiser-stats__item" aria-label={`${views} views`}>
        <EyeIcon />
        <span>{formatCount(views)}</span>
      </span>
    </div>
  );
}

export function Responses({ article, engagement }) {
  const { session, isAuthor, profile } = useAuth();
  const location = useLocation();
  const { comments, setComments, commentsError, commentCount } = engagement;
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const userId = session ? session.user.id : null;

  const submit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    setError("");
    try {
      const comment = await addComment(article.id, text);
      setComments((current) => [comment, ...(current || [])]);
      setBody("");
    } catch {
      setError("Your response couldn't be posted. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (comment) => {
    if (!window.confirm("Delete this response?")) return;
    setError("");
    try {
      await deleteComment(comment.id);
      setComments((current) => current.filter((c) => c.id !== comment.id));
    } catch {
      setError("That response couldn't be deleted. Please try again.");
    }
  };

  return (
    <section id="responses" className="wiser-responses">
      <h2 className="wiser-responses__title">Responses ({commentCount})</h2>

      {session ? (
        <form className="wiser-respond" onSubmit={submit}>
          {profile && (
            <div className="wiser-respond__who">
              <Avatar
                size={32}
                name={profile.display_name}
                src={profile.avatar_url}
              />
              <span>{profile.display_name}</span>
            </div>
          )}
          <textarea
            aria-label="Write a response"
            placeholder="What are your thoughts?"
            maxLength={MAX_COMMENT}
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="wiser-respond__actions">
            <button
              type="submit"
              className="wiser-button wiser-button--small"
              disabled={posting || !body.trim()}
            >
              {posting ? "Posting…" : "Respond"}
            </button>
          </div>
        </form>
      ) : (
        <div className="wiser-respond wiser-respond--signed-out">
          <p>Sign in to join the conversation.</p>
          <Link
            to={loginPath(location.pathname)}
            className="wiser-button wiser-button--small"
          >
            Sign in to respond
          </Link>
        </div>
      )}

      {error && (
        <p className="wiser-error" role="alert">
          {error}
        </p>
      )}
      {commentsError && (
        <p className="wiser-status">Responses couldn't be loaded.</p>
      )}

      {(comments || []).map((comment) => {
        const author = comment.profiles || { display_name: "Reader" };
        return (
          <article key={comment.id} className="wiser-response">
            <div className="wiser-response__head">
              <Avatar
                size={32}
                name={author.display_name}
                src={author.avatar_url}
              />
              <div>
                <div className="wiser-response__name">
                  {author.display_name}
                </div>
                <div className="wiser-meta">
                  {formatDate(comment.created_at)}
                </div>
              </div>
              {(comment.user_id === userId || isAuthor) && (
                <button
                  type="button"
                  className="wiser-response__delete"
                  onClick={() => remove(comment)}
                >
                  Delete
                </button>
              )}
            </div>
            <p className="wiser-response__body">{comment.body}</p>
          </article>
        );
      })}
    </section>
  );
}
