import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";

function normalizeUrl(value) {
  const url = value.trim();
  if (!url || /^(https?:|mailto:|\/)/i.test(url)) return url;
  return `https://${url}`;
}

function shouldShowBubble({ editor, from, to, state }) {
  if (from === to || editor.isActive("codeBlock") || editor.isActive("image")) {
    return false;
  }
  return state.doc.textBetween(from, to).trim().length > 0;
}

function FormatMenu({ editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      link: current.isActive("link"),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      quote: current.isActive("blockquote"),
    }),
  });

  const openLink = () => {
    setLinkValue(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = normalizeUrl(linkValue);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    setLinkOpen(false);
  };

  const button = (label, title, isActive, run, className = "") => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={`wiser-bubble__button ${className} ${
        isActive ? "wiser-bubble__button--active" : ""
      }`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      className="wiser-bubble"
      shouldShow={shouldShowBubble}
      options={{ placement: "top", onHide: () => setLinkOpen(false) }}
    >
      {linkOpen ? (
        <input
          className="wiser-bubble__input"
          autoFocus
          placeholder="Paste or type a link…"
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyLink();
            }
            if (event.key === "Escape") {
              setLinkOpen(false);
              editor.commands.focus();
            }
          }}
        />
      ) : (
        <>
          {button(
            "B",
            "Bold",
            active.bold,
            () => editor.chain().focus().toggleBold().run(),
            "wiser-bubble__button--bold",
          )}
          {button(
            "i",
            "Italic",
            active.italic,
            () => editor.chain().focus().toggleItalic().run(),
            "wiser-bubble__button--italic",
          )}
          {button(
            "Link",
            "Link",
            active.link,
            openLink,
            "wiser-bubble__button--text",
          )}
          <span className="wiser-bubble__divider" />
          {button(
            "T",
            "Large heading",
            active.h2,
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            "wiser-bubble__button--bold",
          )}
          {button(
            "T",
            "Small heading",
            active.h3,
            () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            "wiser-bubble__button--small",
          )}
          {button("❝", "Quote", active.quote, () =>
            editor.chain().focus().toggleBlockquote().run(),
          )}
        </>
      )}
    </BubbleMenu>
  );
}

function InsertMenu({ editor, onPickImage }) {
  const [open, setOpen] = useState(false);

  const action = (label, title, run) => (
    <button
      type="button"
      className="wiser-insert__button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        setOpen(false);
        run();
      }}
    >
      {label}
    </button>
  );

  return (
    <FloatingMenu
      editor={editor}
      className="wiser-insert"
      options={{
        // Phones have no margin to the left of the text.
        placement: window.innerWidth < 800 ? "bottom-start" : "left",
        offset: 12,
      }}
    >
      <button
        type="button"
        className={`wiser-insert__button wiser-insert__toggle ${
          open ? "wiser-insert__toggle--open" : ""
        }`}
        aria-label="Add image, code block or divider"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen(!open)}
      >
        +
      </button>
      {open && (
        <div className="wiser-insert__options">
          {action("Img", "Add an image", onPickImage)}
          {action("{ }", "Add a code block", () =>
            editor.chain().focus().toggleCodeBlock().run(),
          )}
          {action("···", "Add a divider", () =>
            editor.chain().focus().setHorizontalRule().run(),
          )}
        </div>
      )}
    </FloatingMenu>
  );
}

export default function RichEditor({
  initialBody,
  onChange,
  onUploadImage,
  onReady,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onChange, onUploadImage };
  const editorRef = useRef(null);

  const insertImages = async (files) => {
    setUploadError("");
    setUploading(true);
    try {
      for (const file of files) {
        const src = await callbacks.current.onUploadImage(file);
        editorRef.current.chain().focus().setImage({ src, alt: "" }).run();
      }
    } catch (error) {
      setUploadError(error.message || "That image couldn't be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const imagesFrom = (fileList) =>
    Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        underline: false,
        link: { openOnClick: false, autolink: true },
      }),
      Image,
      Markdown,
      Placeholder.configure({ placeholder: "Tell your story…" }),
    ],
    content: initialBody,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "wiser-prose wiser-editor__body",
        "aria-label": "Article body",
      },
      handlePaste: (_view, event) => {
        const images = imagesFrom(event.clipboardData?.files);
        if (images.length === 0) return false;
        insertImages(images);
        return true;
      },
      handleDrop: (_view, event) => {
        const images = imagesFrom(event.dataTransfer?.files);
        if (images.length === 0) return false;
        event.preventDefault();
        insertImages(images);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      callbacks.current.onChange(current.getMarkdown());
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  if (!editor) return null;

  return (
    <>
      <FormatMenu editor={editor} />
      <InsertMenu
        editor={editor}
        onPickImage={() => fileInput.current.click()}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        hidden
        onChange={(event) => {
          insertImages(imagesFrom(event.target.files));
          event.target.value = "";
        }}
      />
      {uploading && <p className="wiser-editor__notice">Uploading image…</p>}
      {uploadError && (
        <p className="wiser-error" role="alert">
          {uploadError}
        </p>
      )}
    </>
  );
}
