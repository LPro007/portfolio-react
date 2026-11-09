import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import WiserLayout, { Avatar } from "./WiserLayout";
import { AUTHOR, formatDate, useArticles } from "./articles";

export default function ArticlePage() {
  const { slug } = useParams();
  const { articles, error } = useArticles();
  const article = articles && articles.find((a) => a.slug === slug);
  const title = article ? article.title : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    document.title = title ? `${title} | Wiser` : "Wiser";
  }, [title]);

  let content;
  if (error) {
    content = (
      <p className="wiser-status">
        This article couldn't be loaded. Please refresh the page.
      </p>
    );
  } else if (!articles) {
    content = <p className="wiser-status">Loading…</p>;
  } else if (!article) {
    content = (
      <p className="wiser-status">
        Article not found. <Link to="/wiser">See all articles</Link>
      </p>
    );
  } else {
    content = (
      <article>
        <h1 className="wiser-article__title">{article.title}</h1>
        {article.subtitle && (
          <p className="wiser-article__subtitle">{article.subtitle}</p>
        )}
        <div className="wiser-article__byline">
          <Avatar size={44} />
          <div>
            <div className="wiser-article__author">{AUTHOR}</div>
            <p className="wiser-meta">
              {article.readTime} min read · {formatDate(article.date)}
            </p>
          </div>
        </div>
        {article.cover && (
          <img className="wiser-article__cover" src={article.cover} alt="" />
        )}
        <div className="wiser-prose">
          <ReactMarkdown>{article.body}</ReactMarkdown>
        </div>
        {article.tags.length > 0 && (
          <div className="wiser-article__tags">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                to={`/wiser?tag=${encodeURIComponent(tag)}`}
                className="wiser-pill"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <WiserLayout>
      <main className="wiser-article">{content}</main>
    </WiserLayout>
  );
}
