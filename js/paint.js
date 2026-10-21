const SVG_NS = "http://www.w3.org/2000/svg";

export function paint(node) {
  const el = document.createElementNS(SVG_NS, node.tag);
  const attrs = node.attrs || {};
  const keys = Object.keys(attrs);
  for (let i = 0; i < keys.length; i += 1) {
    const value = attrs[keys[i]];
    if (value != null) el.setAttribute(keys[i], String(value));
  }
  if (node.text) el.textContent = node.text;
  const kids = node.kids || [];
  for (let i = 0; i < kids.length; i += 1) el.append(paint(kids[i]));
  return el;
}
