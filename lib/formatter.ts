import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
}).enable(["table"]);

export const cleanMarkdownContent = (content: string) => {
  if (!content) return "";
  return content
    .replace(/\{[^}]*\}\]/g, "")
    .replace(/\[\{[^}]*\}\]/g, "")
    .replace(/thisChapter\.k!!!Nested/g, "")
    .trim();
};

export const renderTaxHtml = (content: string) => {
  return md.render(cleanMarkdownContent(content));
};

