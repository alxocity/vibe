import { calendar, echoes, lines, playback, solo, tray } from "./catalog.js";
import { glyphTree, scenePlan, sceneTree } from "./draw.js";
import { el, tx } from "./dom.js";
import { paint } from "./paint.js";
import { echoId, score } from "./score.js";
import { bindInput } from "./input.js";
import { echoHref, linksFor } from "./nav.js";
import { pageAddress, soloPath } from "./paths.js";
import { playbackLine } from "./playback.js";
import { echoGateStatus, liveEchoIds, shareLine, visibleStreak } from "./progress.js";
import { browserBackend, openSave } from "./save.js";
import { flattenTray } from "./tray.js";

const app = document.querySelector("#app");
const mode = document.body.dataset.mode || "home";
const pageId = document.body.dataset.id || "";
const flat = flattenTray(tray);
const withdrawn = echoes.withdrawn;

function utcToday() {
  const date = new Date();
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

function todayEcho() {
  return echoId(utcToday(), calendar.launch).toString();
}

function rowById(items, id) {
  for (let i = 0; i < items.length; i += 1) {
    if (String(items[i].id) === String(id)) return items[i];
  }
  return null;
}

function echoGate(today) {
  return echoGateStatus(rowById(echoes.items, pageId), pageId, today, withdrawn);
}

function liveIds() {
  return liveEchoIds(echoes.items, withdrawn);
}

function names(ids) {
  if (!ids || ids.length === 0) return "none";
  const parts = [];
  for (let i = 0; i < ids.length; i += 1) parts.push(flat.labels[ids[i]] || ids[i]);
  return parts.join(", ");
}

const backend = browserBackend(() => window.localStorage);
const nowMs = () => Date.now();
const soloSave = mode === "daily" || mode === "echo" || mode === "playback" ? null : openSave(backend, "solo", nowMs, flat.ids);
const dailySave = mode === "solo" || mode === "playback" ? null : openSave(backend, "daily", nowMs, flat.ids);

const puzzle = mode === "solo" ? rowById(solo.items, pageId) : mode === "echo" ? rowById(echoes.items, pageId) : null;
const activeSave = mode === "solo" ? soloSave : dailySave;

let picked = [];
let outcome = null;
let gate = mode === "echo" ? echoGate(todayEcho()) : null;
let focusAfter = null;

if (activeSave && puzzle && !gate) {
  picked = activeSave.picked(pageId);
  if (activeSave.doneIds().indexOf(pageId) !== -1) {
    outcome = { status: "pass", line: playbackLine("pass", puzzle.works, lines.notYet) };
  }
}

const pickedLive = el("p", { class: "picked", role: "status", "aria-live": "polite" });
pickedLive.textContent = "Picked " + String(picked.length);

const resultLive = el("p", {
  role: "status",
  "aria-live": "polite",
  tabindex: "-1",
  "data-move": "1",
  "data-focus-id": "outcome",
});
if (outcome) resultLive.textContent = outcome.line;

function liveText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function mast() {
  return el("header", { class: "mast" }, [
    el("div", { class: "arch", "aria-hidden": "true" }),
    el("h1", {}, [tx("Vibe Chamber")]),
  ]);
}

function warningNode() {
  const warn = (soloSave && soloSave.warning) || (dailySave && dailySave.warning);
  if (!warn) return null;
  return el("p", { class: "warning", role: "status" }, [tx(lines.storageWarning)]);
}

function linkNode(item) {
  return el("a", { href: item.href, class: "link", "data-move": "1", "data-focus-id": item.id }, [tx(item.label)]);
}

function field(id, label, value, hint) {
  const input = el("input", {
    type: "text",
    readonly: "readonly",
    "data-move": "1",
    "data-focus-id": id,
    spellcheck: "false",
    autocapitalize: "off",
    autocomplete: "off",
  });
  input.readOnly = true;
  input.value = value;
  input.addEventListener("focus", () => input.select());
  const kids = [el("span", {}, [tx(label)]), input];
  if (hint) kids.push(el("p", { class: "hint" }, [tx(hint)]));
  return el("label", { class: "copy" }, kids);
}

function copyLink() {
  return field("copy-link", "Copy link", pageAddress(window.location), "Select the address and copy it.");
}

function clearButton() {
  const button = el(
    "button",
    { type: "button", class: "action action-quiet", "data-move": "1", "data-focus-id": "clear" },
    [tx(lines.clear)],
  );
  button.addEventListener("click", () => {
    activeSave.clearAll();
    picked = [];
    outcome = null;
    focusAfter = "clear";
    render();
  });
  return button;
}

function streakNode(today) {
  if (!dailySave) return null;
  const count = visibleStreak(dailySave.doneIds(), today, liveIds());
  if (count == null) return null;
  return el("p", { class: "streak" }, [tx("Streak " + String(count))]);
}

function sceneLabel(order) {
  if (order.length === 0) return "Picture";
  const parts = [];
  for (let i = 0; i < order.length; i += 1) parts.push(flat.labels[order[i]] || order[i]);
  return "Picture of " + parts.join(", ");
}

function sceneNode(plan) {
  return el("figure", { class: "scene" }, [
    paint(sceneTree(plan)),
    el("figcaption", {}, [tx(sceneLabel(plan.order))]),
  ]);
}

function rubric(row) {
  return el("dl", { class: "rubric" }, [
    el("dt", {}, [tx("Required")]),
    el("dd", {}, [tx(names(row.required))]),
    el("dt", {}, [tx("Any of")]),
    el("dd", {}, [tx(names(row.anyOf))]),
    el("dt", {}, [tx("Leave out")]),
    el("dd", {}, [tx(names(row.forbidden))]),
  ]);
}

function toggle(id) {
  const index = picked.indexOf(id);
  if (index !== -1) picked = picked.slice(0, index).concat(picked.slice(index + 1));
  else picked = picked.concat([id]);
  outcome = null;
  activeSave.setPicked(pageId, picked);
  focusAfter = "block-" + id;
  render();
}

function onCheck() {
  if (!puzzle) return;
  if (mode === "echo") {
    gate = echoGate(todayEcho());
    if (gate) {
      outcome = null;
      focusAfter = "copy-link";
      render();
      return;
    }
  }
  const result = score(picked, puzzle, flat.ids);
  const line = playbackLine(result.status, puzzle.works, lines.notYet);
  if (!line) return;
  outcome = { status: result.status, line };
  if (result.status === "pass") activeSave.markDone(pageId);
  focusAfter = "outcome";
  render();
}

function pickedCount() {
  liveText(pickedLive, "Picked " + String(picked.length));
  return pickedLive;
}

function trayNodes() {
  const nodes = [pickedCount()];
  for (let g = 0; g < tray.groups.length; g += 1) {
    const group = tray.groups[g];
    nodes.push(el("h3", {}, [tx(group.label)]));
    const grid = el("div", { class: "tray", role: "group", "aria-label": group.label });
    for (let i = 0; i < group.blocks.length; i += 1) {
      const block = group.blocks[i];
      const on = picked.indexOf(block.id) !== -1;
      const button = el("button", {
        type: "button",
        class: on ? "tile is-picked" : "tile",
        "data-move": "1",
        "data-focus-id": "block-" + block.id,
        "aria-pressed": on ? "true" : "false",
      });
      button.append(paint(glyphTree(block.id)), tx(block.label));
      button.addEventListener("click", () => toggle(block.id));
      grid.append(button);
    }
    nodes.push(grid);
  }
  const check = el(
    "button",
    {
      type: "button",
      class: "action",
      "data-move": "1",
      "data-focus-id": "check",
    },
    [tx("Check")],
  );
  check.addEventListener("click", onCheck);
  nodes.push(check);
  return nodes;
}

function outcomeNode(row) {
  if (!outcome || !row) return null;
  liveText(resultLive, outcome.line);
  return el("div", { class: "outcome" }, [
    el("div", { class: "frame" }, [resultLive]),
    rubric(row),
  ]);
}

function shareNode() {
  if (mode !== "echo" || gate || !dailySave) return null;
  if (dailySave.doneIds().indexOf(pageId) === -1) return null;
  return field("share-card", "Share card", shareLine(pageId, lines), "Select the line and copy it.");
}

function playNodes(row) {
  const nodes = [
    el("h2", {}, [tx(mode === "solo" ? row.title : "Echo " + pageId)]),
    el("p", { class: "situation" }, [tx(row.situation)]),
    outcomeNode(row),
    sceneNode(scenePlan(picked, flat.ids)),
  ];
  const trayParts = trayNodes();
  for (let i = 0; i < trayParts.length; i += 1) nodes.push(trayParts[i]);
  if (mode === "solo" && soloSave.doneIds().indexOf(pageId) !== -1) {
    const index = solo.items.findIndex((item) => String(item.id) === pageId);
    const next = solo.items[index + 1];
    if (next) nodes.push(linkNode({ id: "next", href: soloPath(next.id), label: "Next puzzle" }));
  }
  nodes.push(shareNode());
  if (mode === "echo") nodes.push(streakNode(todayEcho()));
  return nodes;
}

function view() {
  const nodes = [mast(), warningNode()];
  const today = todayEcho();
  const todayRow = rowById(echoes.items, today);
  const todayOpen = echoGateStatus(todayRow, today, today, withdrawn) == null;

  const home = linksFor(mode, {}).find((item) => item.id === "home");
  if (home) nodes.push(linkNode(home));

  if (mode === "home") {
    if (todayOpen) nodes.push(el("p", { class: "echo-id" }, [tx("Echo " + today)]));
    const cleared = soloSave.doneIds();
    const items = solo.items.map((item) => ({
      id: item.id,
      title: cleared.indexOf(String(item.id)) === -1 ? item.title : item.title + ", works",
    }));
    const links = linksFor("home", { solo: items, todayHref: todayOpen ? echoHref(today) : null });
    for (let i = 0; i < links.length; i += 1) nodes.push(linkNode(links[i]));
    nodes.push(copyLink());
  } else if (mode === "daily") {
    nodes.push(el("h2", {}, [tx("Daily")]));
    if (!todayOpen) nodes.push(el("p", { class: "frame" }, [tx(lines.noPuzzle)]));
    else {
      nodes.push(el("p", { class: "echo-id" }, [tx("Echo " + today)]));
      nodes.push(linkNode({ id: "today", href: echoHref(today), label: "Open today" }));
      nodes.push(field("copy-link", "Copy link", pageAddress({ origin: window.location.origin, pathname: echoHref(today) }), "Select the address and copy it."));
    }
    nodes.push(streakNode(today));
    if (!todayOpen) nodes.push(copyLink());
    nodes.push(clearButton());
  } else if (mode === "playback") {
    nodes.push(el("h2", {}, [tx("Playback")]));
    nodes.push(el("p", {}, [tx(lines.playbackNote)]));
    for (let i = 0; i < playback.frames.length; i += 1) {
      nodes.push(el("div", { class: "frame" }, [el("p", {}, [tx(playback.frames[i])])]));
    }
    nodes.push(copyLink());
  } else if (mode === "echo" && gate === "not-today") {
    nodes.push(el("p", { class: "frame" }, [tx(lines.notToday)]));
    nodes.push(copyLink());
    nodes.push(clearButton());
  } else if (mode === "echo" && gate === "no-puzzle") {
    nodes.push(el("p", { class: "frame" }, [tx(lines.noPuzzle)]));
    nodes.push(copyLink());
    nodes.push(clearButton());
  } else if (puzzle) {
    const parts = playNodes(puzzle);
    for (let i = 0; i < parts.length; i += 1) if (parts[i]) nodes.push(parts[i]);
    nodes.push(copyLink());
    nodes.push(clearButton());
  }

  return nodes.filter((node) => node != null);
}

function render() {
  const keep = focusAfter || (document.activeElement && document.activeElement.getAttribute("data-focus-id"));
  focusAfter = null;
  const nodes = view();
  app.replaceChildren();
  for (let i = 0; i < nodes.length; i += 1) app.append(nodes[i]);
  if (keep) {
    const next = app.querySelector('[data-focus-id="' + keep + '"]');
    if (next) next.focus();
  }
}

bindInput();
render();
