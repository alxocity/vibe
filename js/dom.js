export function el(tag, attrs, kids) {
  const node = document.createElement(tag);
  if (attrs) {
    const keys = Object.keys(attrs);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = attrs[key];
      if (value == null || value === false) continue;
      if (key === "class") node.className = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    }
  }
  if (kids) {
    for (let i = 0; i < kids.length; i += 1) {
      if (kids[i] != null) node.append(kids[i]);
    }
  }
  return node;
}

export function tx(text) {
  return document.createTextNode(text);
}
