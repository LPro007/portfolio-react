import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import WiserLayout from "./WiserLayout";
import RichEditor from "./RichEditor";
import PublishDialog from "./PublishDialog";
import { makeSlug, saveArticle, uploadImage, useArticleById } from "./articles";

const AUTOSAVE_DELAY = 1000;

const STATUS_TEXT = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save. Check your connection.",
};

function firstImage(markdown) {
  const match = markdown.match(/!\[[^\]]*\]\(([^)\s]+)/);
  return match ? match[1] : "";
}

function Editor({ id, existing }) {
  const navigate = useNavigate();
  const isPublished = Boolean(existing && existing.published_at);
  const [draft, setDraft] = useState({
    title: existing ? existing.title : "",
    subtitle: existing ? existing.subtitle : "",
    body: existing ? existing.body : "",
    cover: existing ? existing.cover : "",
    tags: existing ? existing.tags : [],
  });
  const [status, setStatus] = useState("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const titleInput = useRef(null);
  const [editor, setEditor] = useState(null);

  const latest = useRef(draft);
  latest.current = draft;
  const version = useRef(0);
  const savedVersion = useRef(0);
  const saveQueue = useRef(Promise.resolve());

  const update = useCallback((fields) => {
    version.current += 1;
    latest.current = { ...latest.current, ...fields };
    setDraft(latest.current);
    setStatus("dirty");
  }, []);

  // Saves run one at a time so an older save can't overwrite a newer one.
  const save = useCallback(
    (publication) => {
      const savingVersion = version.current;
      setStatus("saving");
      const task = saveQueue.current
        .then(() => saveArticle(id, latest.current, publication))
        .then(() => {
          savedVersion.current = Math.max(savedVersion.current, savingVersion);
          if (version.current === savingVersion) setStatus("saved");
        });
      saveQueue.current = task.catch(() => {});
      return task;
    },
    [id],
  );

  const autosave = useCallback(() => {
    save().catch(() => setStatus("error"));
  }, [save]);

  // Published stories change only when you press "Save and publish".
  useEffect(() => {
    if (isPublished || status !== "dirty") return undefined;
    const timer = setTimeout(autosave, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [draft, status, isPublished, autosave]);

  // Save a pending draft when navigating away inside the app.
  useEffect(
    () => () => {
      if (!isPublished && version.current !== savedVersion.current) autosave();
    },
    [isPublished, autosave],
  );

  useEffect(() => {
    if (status !== "dirty" && status !== "saving" && status !== "error") {
      return undefined;
    }
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  useEffect(() => {
    document.title = `${draft.title || "New story"} | Wiser`;
  }, [draft.title]);

  // Grow the title field to fit, including the initial loaded title.
  useEffect(() => {
    const input = titleInput.current;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [draft.title]);

  const onBodyChange = useCallback((body) => update({ body }), [update]);
  const onUploadImage = useCallback((file) => uploadImage(id, file), [id]);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const openDialog = () => {
    if (!latest.current.cover) {
      const cover = firstImage(latest.current.body);
      if (cover) update({ cover });
    }
    setDialogOpen(true);
  };

  const publish = async () => {
    if (isPublished) {
      await save();
      navigate(`/wiser/${existing.slug}`);
      return;
    }
    const slug = makeSlug(latest.current.title);
    await save({ slug, published_at: new Date().toISOString() });
    navigate(`/wiser/${slug}`);
  };

  const canPublish = draft.title.trim() && draft.body.trim();
  const label = isPublished ? "Published" : "Draft";

  return (
    <WiserLayout
      status={`${label}${STATUS_TEXT[status] ? ` · ${STATUS_TEXT[status]}` : ""}`}
      actions={
        <>
          <Link to="/wiser/stories" className="wiser-header__link">
            Stories
          </Link>
          <button
            type="button"
            className="wiser-button wiser-button--green wiser-button--small"
            disabled={!canPublish}
            onClick={openDialog}
          >
            {isPublished ? "Save and publish" : "Publish"}
          </button>
        </>
      }
    >
      <main className="wiser-editor">
        <textarea
          ref={titleInput}
          className="wiser-editor__title"
          aria-label="Title"
          placeholder="Title"
          rows={1}
          autoFocus={!draft.title}
          value={draft.title}
          onChange={(event) =>
            update({ title: event.target.value.replace(/\n/g, " ") })
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" && editor) {
              event.preventDefault();
              editor.commands.focus("start");
            }
          }}
        />
        <RichEditor
          initialBody={existing ? existing.body : ""}
          onChange={onBodyChange}
          onUploadImage={onUploadImage}
          onReady={setEditor}
        />
      </main>
      {dialogOpen && (
        <PublishDialog
          draft={draft}
          isPublished={isPublished}
          onChange={update}
          onUploadImage={onUploadImage}
          onPublish={publish}
          onClose={closeDialog}
        />
      )}
    </WiserLayout>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const { data: existing, error, loading } = useArticleById(id);

  if (error) {
    return (
      <WiserLayout>
        <p className="wiser-status">
          This story couldn't be loaded. Please refresh the page.
        </p>
      </WiserLayout>
    );
  }
  if (loading) {
    return (
      <WiserLayout>
        <p className="wiser-status">Loading…</p>
      </WiserLayout>
    );
  }
  return <Editor key={id} id={id} existing={existing} />;
}
