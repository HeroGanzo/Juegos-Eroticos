// Minimal & safe markdown renderer (escapes all HTML first).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(url: string): string {
  const u = url.trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : "#";
}

function inline(src: string): string {
  let out = escapeHtml(src);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    return `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" />`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const href = safeUrl(url);
    const ext = /^https?:/i.test(href);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""}>${text}</a>`;
  });
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return out;
}

export function renderMarkdown(src: string | null | undefined): string {
  if (!src) return "";
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let html = "";
  let para: string[] = [];
  let list: "ul" | "ol" | null = null;

  const flushPara = () => {
    if (para.length) {
      html += `<p>${para.map(inline).join("<br />")}</p>`;
      para = [];
    }
  };
  const closeList = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };
  const openList = (kind: "ul" | "ol") => {
    if (list !== kind) {
      closeList();
      html += `<${kind}>`;
      list = kind;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      flushPara();
      closeList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara();
      closeList();
      const level = Math.min(m[1].length + 1, 5);
      html += `<h${level}>${inline(m[2])}</h${level}>`;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushPara();
      closeList();
      html += "<hr />";
      continue;
    }
    if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      flushPara();
      openList("ul");
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara();
      openList("ol");
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara();
      closeList();
      html += `<blockquote>${inline(m[1])}</blockquote>`;
      continue;
    }
    closeList();
    para.push(line);
  }
  flushPara();
  closeList();
  return html;
}
