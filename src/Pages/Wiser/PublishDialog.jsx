import { useEffect, useRef, useState } from "react";
import { AUTHOR } from "./articles";

const MAX_TAGS = 5;

export default function PublishDialog({
  draft,
  isPublished,
  onChange,
  onUploadImage,
  onPublish,
  onClose,
}) {
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const addTag = () => {
    const tag = tagInput.trim().replace(/,$/, "");
    if (tag && !draft.tags.includes(tag) && draft.tags.length < MAX_TAGS) {
      onChange({ tags: [...draft.tags, tag] });
    }
    setTagInput("");
  };

  const pickCover = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      onChange({ cover: await onUploadImage(file) });
    } catch (uploadError) {
      setError(uploadError.message || "That image couldn't be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    setError("");
    setPublishing(true);
    try {
      await onPublish();
    } catch {
      setError("Publishing failed. Check your connection and try again.");
      setPublishing(false);
    }
  };

  return (
    <div
      className="wiser-publish"
      role="dialog"
      aria-modal="true"
      aria-label="Publish story"
    >
      <button
        type="button"
        className="wiser-publish__close"
        aria-label="Close"
        onClick={onClose}
      >
        ×
      </button>
      <div className="wiser-publish__grid">
        <section>
          <h2 className="wiser-publish__heading">Story preview</h2>
          <button
            type="button"
            className="wiser-publish__cover"
            onClick={() => fileInput.current.click()}
          >
            {draft.cover ? (
              <img src={draft.cover} alt="" />
            ) : (
              <span>
                {uploading
                  ? "Uploading…"
                  : "Add a preview image to make your story stand out."}
              </span>
            )}
          </button>
          {draft.cover && (
            <button
              type="button"
              className="wiser-publish__remove"
              onClick={() => onChange({ cover: "" })}
            >
              Remove image
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            hidden
            onChange={(event) => {
              pickCover(event.target.files[0]);
              event.target.value = "";
            }}
          />
          <input
            className="wiser-publish__title"
            aria-label="Preview title"
            placeholder="Write a preview title"
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
          <input
            className="wiser-publish__subtitle"
            aria-label="Preview subtitle"
            placeholder="Write a preview subtitle…"
            value={draft.subtitle}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
          <p className="wiser-publish__note">
            Changes here affect how your story appears on WISER, not the
            contents of the story.
          </p>
        </section>

        <section>
          <p className="wiser-publish__to">
            Publishing to: <strong>{AUTHOR}</strong>
          </p>
          <p className="wiser-publish__label">
            Add topics (up to {MAX_TAGS}) so readers know what your story is
            about
          </p>
          <div className="wiser-publish__tags">
            {draft.tags.map((tag) => (
              <span key={tag} className="wiser-pill">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() =>
                    onChange({ tags: draft.tags.filter((t) => t !== tag) })
                  }
                >
                  ×
                </button>
              </span>
            ))}
            {draft.tags.length < MAX_TAGS && (
              <input
                aria-label="Add a topic"
                placeholder="Add a topic…"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onBlur={addTag}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTag();
                  }
                  if (
                    event.key === "Backspace" &&
                    !tagInput &&
                    draft.tags.length > 0
                  ) {
                    onChange({ tags: draft.tags.slice(0, -1) });
                  }
                }}
              />
            )}
          </div>
          {error && (
            <p className="wiser-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="wiser-button wiser-button--green"
            disabled={publishing || uploading || !draft.title.trim()}
            onClick={publish}
          >
            {publishing
              ? "Publishing…"
              : isPublished
              ? "Save and publish"
              : "Publish now"}
          </button>
        </section>
      </div>
    </div>
  );
}
