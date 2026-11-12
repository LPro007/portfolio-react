import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const AUTHOR = "Daniel Brambila";

const IMAGE_BUCKET = "article-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const WORDS_PER_MINUTE = 225;
const SUMMARY_COLUMNS =
  "id,slug,title,subtitle,cover,tags,read_time,published_at,updated_at";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

function useQuery(run, key) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    run().then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (error) => !cancelled && setState({ data: null, error, loading: false }),
    );
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  return { ...state, reload: () => setAttempt((n) => n + 1) };
}

export function usePublishedArticles() {
  return useQuery(
    async () =>
      unwrap(
        await supabase
          .from("articles")
          .select(SUMMARY_COLUMNS)
          .not("published_at", "is", null)
          .order("published_at", { ascending: false }),
      ),
    "published",
  );
}

export function useArticle(slug) {
  return useQuery(
    async () =>
      unwrap(
        await supabase
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .not("published_at", "is", null)
          .maybeSingle(),
      ),
    slug,
  );
}

export function useStories() {
  return useQuery(
    async () =>
      unwrap(
        await supabase
          .from("articles")
          .select(SUMMARY_COLUMNS)
          .order("updated_at", { ascending: false }),
      ),
    "stories",
  );
}

export function useArticleById(id) {
  return useQuery(
    async () =>
      unwrap(
        await supabase.from("articles").select("*").eq("id", id).maybeSingle(),
      ),
    id,
  );
}

function readTime(body) {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

// `publication` is only passed on first publish, so an autosave can never
// change whether or where an article is published.
export async function saveArticle(id, draft, publication = {}) {
  unwrap(
    await supabase.from("articles").upsert({
      id,
      title: draft.title,
      subtitle: draft.subtitle,
      body: draft.body,
      cover: draft.cover,
      tags: draft.tags,
      read_time: readTime(draft.body),
      updated_at: new Date().toISOString(),
      ...publication,
    }),
  );
}

// The random suffix keeps slugs unique and clear of routes like /wiser/new.
export function makeSlug(title) {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
  const suffix = crypto.randomUUID().slice(0, 6);
  return base ? `${base}-${suffix}` : suffix;
}

export async function deleteArticle(id) {
  unwrap(await supabase.from("articles").delete().eq("id", id));
}

export async function uploadImage(articleId, file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file isn't an image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const extension = file.type.split("/")[1];
  const path = `${articleId}/${crypto.randomUUID()}.${extension}`;
  const bucket = supabase.storage.from(IMAGE_BUCKET);
  unwrap(
    await bucket.upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
    }),
  );
  return bucket.getPublicUrl(path).data.publicUrl;
}

const COMMENT_COLUMNS =
  "id,body,created_at,user_id,profiles(display_name,avatar_url)";

export async function recordView(articleId) {
  unwrap(await supabase.rpc("record_view", { article_id: articleId }));
}

export async function fetchHearted(articleId, userId) {
  const row = unwrap(
    await supabase
      .from("hearts")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  return Boolean(row);
}

export async function setHeart(articleId, userId, hearted) {
  if (hearted) {
    unwrap(await supabase.from("hearts").insert({ article_id: articleId }));
  } else {
    unwrap(
      await supabase
        .from("hearts")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId),
    );
  }
}

export async function fetchComments(articleId) {
  return unwrap(
    await supabase
      .from("comments")
      .select(COMMENT_COLUMNS)
      .eq("article_id", articleId)
      .order("created_at", { ascending: false }),
  );
}

export async function addComment(articleId, body) {
  return unwrap(
    await supabase
      .from("comments")
      .insert({ article_id: articleId, body })
      .select(COMMENT_COLUMNS)
      .single(),
  );
}

export async function deleteComment(id) {
  unwrap(await supabase.from("comments").delete().eq("id", id));
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact" });

export function formatCount(count) {
  return compact.format(count || 0);
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
