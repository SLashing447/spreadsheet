// sanitize.ts
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Allowed tags and attributes (simple whitelist)
  const ALLOWED_TAGS = new Set([
    "a",
    "b",
    "i",
    "u",
    "strong",
    "em",
    "small",
    "sub",
    "sup",
    "p",
    "br",
    "div",
    "span",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ]);

  const ALLOWED_ATTRS: Record<string, string[]> = {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    // these tags will accept global safe attributes below
  };

  const GLOBAL_ATTRS = ["class", "id", "title", "aria-label", "role"];

  // safe URL schemes
  function isSafeUrl(url: string | null): boolean {
    if (!url) return false;
    url = url.trim().toLowerCase();
    // strip harmless leading whitespace/newlines
    // block javascript:, data: (except images), vbscript:, file:, etc.
    try {
      if (url.startsWith("data:")) {
        // allow data images only
        return /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(
          url
        );
      }
      const allowed = ["http:", "https:", "mailto:", "tel:"];
      // If url is relative (no scheme) allow it
      if (!/^[a-z0-9.+-]+:/i.test(url)) return true;
      return allowed.some((scheme) => url.startsWith(scheme));
    } catch {
      return false;
    }
  }

  // Parse HTML into DOM
  const doc = new DOMParser().parseFromString(
    `<div>${input}</div>`,
    "text/html"
  );
  const container = doc.body.firstElementChild as HTMLElement;

  function sanitizeNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // remove blacklisted elements entirely (and their children)
      const REMOVE_ENTIRELY = new Set([
        "script",
        "style",
        "iframe",
        "object",
        "embed",
        "link",
        "meta",
        "base",
        "form",
        "input",
        "textarea",
        "button",
        "select",
      ]);
      if (REMOVE_ENTIRELY.has(tag)) {
        el.remove();
        return;
      }

      if (!ALLOWED_TAGS.has(tag)) {
        // tag not allowed: unwrap it (keep children) or replace with text
        // We'll replace the element with its children (safer than dropping text)
        const parent = el.parentNode!;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        return; // children will be processed by subsequent traversal
      }

      // sanitize attributes: remove event handlers, style, and disallowed attrs
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        const val = attr.value;

        // remove event handlers
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
          continue;
        }

        // remove style to avoid CSS-based attacks (or whitelist small subset if needed)
        if (name === "style") {
          el.removeAttribute(attr.name);
          continue;
        }

        // allow only whitelisted attributes for this tag or global ones
        const allowedForTag = ALLOWED_ATTRS[tag] || [];
        if (!allowedForTag.includes(name) && !GLOBAL_ATTRS.includes(name)) {
          el.removeAttribute(attr.name);
          continue;
        }

        // validate URLs for href/src
        if (name === "href" || name === "src") {
          if (!isSafeUrl(val)) {
            el.removeAttribute(attr.name);
            continue;
          }
          // for <a rel and target: encourage safe defaults
          if (name === "href" && el.tagName.toLowerCase() === "a") {
            // force rel if target="_blank"
            if (el.getAttribute("target") === "_blank")
              el.setAttribute("rel", "noopener noreferrer");
          }
        }
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      // remove comments
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
      return;
    }
    // Recurse children (use snapshot because we may mutate)
    const children = Array.from(node.childNodes);
    for (const child of children) sanitizeNode(child);
  }

  sanitizeNode(container);

  // return innerHTML of sanitized container
  return container.innerHTML;
}
