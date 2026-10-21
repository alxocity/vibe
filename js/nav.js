import { echoPath, soloPath } from "./paths.js";

export function linksFor(mode, ctx) {
  const links = [];
  if (mode !== "home") links.push({ id: "home", href: "/", label: "Home" });
  if (mode === "home") {
    links.push({ id: "daily", href: "/daily/", label: "Daily" });
    if (ctx.todayHref) links.push({ id: "today", href: ctx.todayHref, label: "Open today" });
    const items = ctx.solo || [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      links.push({
        id: "solo-" + String(item.id),
        href: soloPath(item.id),
        label: String(item.id) + ". " + item.title,
      });
    }
    links.push({ id: "playback", href: "/playback/", label: "Playback" });
  }
  if (mode === "daily" && ctx.todayHref) {
    links.push({ id: "today", href: ctx.todayHref, label: "Open today" });
  }
  if (mode === "solo" && ctx.nextId != null) {
    links.push({ id: "next", href: soloPath(ctx.nextId), label: "Next puzzle" });
  }
  return links;
}

export function echoHref(id) {
  return echoPath(id);
}
