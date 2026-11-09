import { useEffect, useState } from "react";

export const AUTHOR = "Daniel Brambila";

// Every .md file in src/content/articles is published; its filename is the URL slug.
const articleFiles = require.context("../../content/articles", false, /\.md$/);

const WORDS_PER_MINUTE = 225;

function parseArticle(slug, raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const meta = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const colon = line.indexOf(":");
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    meta[key] = line
      .slice(colon + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  });

  if (!meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date || "")) return null;

  const body = match[2].trim();
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title: meta.title,
    subtitle: meta.subtitle || "",
    date: meta.date,
    cover: meta.cover || "",
    tags: (meta.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    readTime: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
    body,
  };
}

async function fetchArticle(key) {
  const slug = key.replace(/^\.\//, "").replace(/\.md$/, "");
  const response = await fetch(articleFiles(key));
  if (!response.ok) throw new Error(`Could not load article "${slug}"`);

  const article = parseArticle(slug, await response.text());
  if (!article) {
    console.warn(
      `Skipping article "${slug}": it needs frontmatter with a title and a YYYY-MM-DD date.`
    );
  }
  return article;
}

let articlesPromise = null;

function loadArticles() {
  if (!articlesPromise) {
    articlesPromise = Promise.all(articleFiles.keys().map(fetchArticle))
      .then((articles) =>
        articles
          .filter(Boolean)
          .sort((a, b) => b.date.localeCompare(a.date))
      )
      .catch((error) => {
        articlesPromise = null;
        throw error;
      });
  }
  return articlesPromise;
}

// `articles` is null until loaded.
export function useArticles() {
  const [state, setState] = useState({ articles: null, error: null });

  useEffect(() => {
    let cancelled = false;
    loadArticles().then(
      (articles) => !cancelled && setState({ articles, error: null }),
      (error) => !cancelled && setState({ articles: null, error })
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// Dates are calendar days, so format in UTC to stop them shifting back a day
// in timezones behind UTC.
export function formatDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
