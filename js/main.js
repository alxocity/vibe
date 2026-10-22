import { calendar, echoes, lines, playback, solo, tray } from "./catalog.js";
import { glyphTree, scenePlan, sceneTree, shareGlyph } from "./draw.js";
import { ghostIds, showGhosts } from "./ghosts.js";
import { el, tx } from "./dom.js";
import { ACTION_MS, flightPlan, playFly } from "./motion.js";
import { paint } from "./paint.js";
import { RECENT_LIMIT, blocksFor, checkMarks, remember, toggleId } from "./picker.js";
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
let activeTab = tray.groups.length ? tray.groups[0].id : "";
let trayOpen = false;
let promptOpen = true;
let shakeOnce = false;
let recent = [];
let marks = null;
const arriving = Object.create(null);
const flyers = Object.create(null);
const flyerToken = Object.create(null);

if (activeSave && puzzle && !gate) {
  picked = activeSave.picked(pageId);
  if (picked.length > 0) promptOpen = false;
  if (activeSave.doneIds().indexOf(pageId) !== -1) {
    outcome = { status: "pass", line: playbackLine("pass", puzzle.works, lines.notYet) };
    marks = checkMarks(picked, puzzle);
  }
}

const pickedLive = el("p", { id: "picked-count", class: "picked", role: "status", "aria-live": "polite" });
pickedLive.textContent = "Picked " + String(picked.length);
const shareLive = el("p", { id: "share-status", class: "share-status", role: "status", "aria-live": "polite" });

const resultLive = el("p", {
  role: "status",
  "aria-live": "polite",
  tabindex: "-1",
  "data-move": "1",
  "data-focus-id": "outcome",
});
if (outcome) resultLive.textContent = outcome.line;

function seedRecent() {
  const next = [];
  for (let i = picked.length - 1; i >= 0; i -= 1) {
    next.push(picked[i]);
    if (next.length >= RECENT_LIMIT) break;
  }
  recent = next;
}
seedRecent();

function liveText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;
}

function sideBySide() {
  return window.matchMedia("(orientation: landscape) and (min-width: 560px)").matches === true;
}

function bagModal() {
  return trayOpen && !sideBySide();
}

function boxOf(node) {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function blockNode(id) {
  return document.querySelector('[data-focus-id="block-' + id + '"]');
}

function layerNode(id) {
  return document.querySelector('.scene [data-layer="' + id + '"]');
}

function poseNode(id) {
  return document.querySelector('.scene [data-pose="' + id + '"]');
}

function dropFlyer(id) {
  const old = flyers[id];
  if (!old) return;
  delete flyers[id];
  old.remove();
}

function settleFlights() {
  const ids = Object.keys(flyers);
  for (let i = 0; i < ids.length; i += 1) {
    flyerToken[ids[i]] = (flyerToken[ids[i]] || 0) + 1;
    dropFlyer(ids[i]);
  }
  const copies = document.querySelectorAll(".flyer");
  for (let i = 0; i < copies.length; i += 1) copies[i].remove();
  const pending = Object.keys(arriving);
  for (let i = 0; i < pending.length; i += 1) delete arriving[pending[i]];
  const held = document.querySelectorAll(".scene [data-pose].is-held");
  for (let i = 0; i < held.length; i += 1) held[i].classList.remove("is-held");
}

function startFly(id, from, to) {
  const token = (flyerToken[id] || 0) + 1;
  flyerToken[id] = token;
  dropFlyer(id);
  const flyer = document.createElement("div");
  flyer.className = "flyer";
  flyer.setAttribute("aria-hidden", "true");
  flyer.append(paint(glyphTree(id)));
  document.body.append(flyer);
  flyers[id] = flyer;
  const anim = playFly(flyer, from, to, ACTION_MS);
  const done = () => {
    if (flyerToken[id] !== token) return;
    if (flyers[id] === flyer) delete flyers[id];
    flyer.remove();
    delete arriving[id];
    const pose = poseNode(id);
    if (pose) pose.classList.remove("is-held");
  };
  anim.onfinish = done;
  anim.oncancel = done;
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

let copyNote = 0;
let copyFailed = false;

function noteCopied() {
  liveText(shareLive, "Link copied");
  const token = ++copyNote;
  window.setTimeout(() => {
    if (token !== copyNote) return;
    if (shareLive.textContent !== "Link copied") return;
    liveText(shareLive, "");
  }, 1400);
}

function failCopy() {
  if (!trayOpen) {
    liveText(shareLive, "Couldn't copy. Select the address.");
    return;
  }
  copyFailed = true;
  focusAfter = "copy-link";
  render();
  liveText(shareLive, "Couldn't copy. Select the address.");
}

function writeSelection(url) {
  const input = el("input", { type: "text", class: "copy-hold", readonly: "readonly", tabindex: "-1", "aria-hidden": "true" });
  input.readOnly = true;
  input.value = url;
  const back = document.activeElement;
  document.body.append(input);
  input.focus();
  input.select();
  let ok = false;
  try {
    ok = document.execCommand("copy") === true;
  } catch (error) {
    ok = false;
  }
  input.remove();
  if (back && back !== input && back.isConnected) back.focus();
  return ok;
}

function copyUrl(url) {
  if (writeSelection(url)) {
    noteCopied();
    return;
  }
  failCopy();
}

function sharePage(url) {
  const share = navigator.share;
  if (typeof share !== "function") {
    copyUrl(url);
    return;
  }
  let pending = null;
  try {
    pending = share.call(navigator, { url: url });
  } catch (error) {
    if (error && error.name === "AbortError") return;
    copyUrl(url);
    return;
  }
  if (!pending || typeof pending.then !== "function") {
    copyUrl(url);
    return;
  }
  pending.then(() => {}, (error) => {
    if (error && error.name === "AbortError") return;
    failCopy();
  });
}

function shareName() {
  if (typeof navigator.share === "function") return "Share link";
  return "Copy link";
}

function shareButton() {
  const url = pageAddress(window.location);
  const name = shareName();
  const button = el(
    "button",
    {
      type: "button",
      class: "share",
      "data-move": "1",
      "data-focus-id": "share-link",
      "aria-label": name,
      title: name,
    },
    [paint(shareGlyph())],
  );
  button.addEventListener("click", () => sharePage(url));
  return button;
}

function shareControl() {
  return el("div", { class: "share-wrap" }, [shareButton(), shareLive]);
}

function clearButton() {
  const button = el(
    "button",
    { type: "button", class: "action action-quiet", "data-move": "1", "data-focus-id": "clear" },
    [tx(lines.clear)],
  );
  button.addEventListener("click", () => {
    settleFlights();
    activeSave.clearAll();
    picked = [];
    recent = [];
    outcome = null;
    marks = null;
    promptOpen = true;
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
  const figure = el("figure", { class: "scene" }, [
    paint(sceneTree(plan)),
    el("figcaption", {}, [tx(sceneLabel(plan.order))]),
  ]);
  if (marks) {
    for (let i = 0; i < marks.correct.length; i += 1) {
      const pose = figure.querySelector('[data-pose="' + marks.correct[i] + '"]');
      if (pose) pose.classList.add("is-correct");
    }
    for (let i = 0; i < marks.wrong.length; i += 1) {
      const pose = figure.querySelector('[data-pose="' + marks.wrong[i] + '"]');
      if (pose) pose.classList.add("is-wrong");
    }
  }
  const ids = Object.keys(arriving);
  for (let i = 0; i < ids.length; i += 1) {
    const pose = figure.querySelector('[data-pose="' + ids[i] + '"]');
    if (pose) pose.classList.add("is-held");
  }
  return figure;
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

function currentPlan() {
  const plan = scenePlan(picked, flat.ids);
  const missed = marks ? marks.missed : [];
  const ghosts = ghostIds(missed, showGhosts);
  if (ghosts.length > 0) plan.ghosts = ghosts;
  return plan;
}

function toggle(id, fromRecent) {
  const adding = picked.indexOf(id) === -1;
  const firstPick = adding && picked.length === 0;
  const origin = fromRecent ? document.querySelector('[data-focus-id="recent-' + id + '"]') : blockNode(id);
  const from = boxOf(adding ? origin : layerNode(id));
  picked = toggleId(picked, id);
  recent = remember(recent, id, RECENT_LIMIT);
  if (firstPick) promptOpen = false;
  outcome = null;
  marks = null;
  activeSave.setPicked(pageId, picked);
  focusAfter = (fromRecent ? "recent-" : "block-") + id;
  if (adding) arriving[id] = true;
  else delete arriving[id];
  render();
  const back = fromRecent ? document.querySelector('[data-focus-id="recent-' + id + '"]') : blockNode(id);
  const to = boxOf(adding ? layerNode(id) : back);
  const plan = flightPlan(prefersReduced(), from, to);
  if (plan.kind === "fly") startFly(id, from, to);
  else {
    delete arriving[id];
    const pose = poseNode(id);
    if (pose) pose.classList.remove("is-held");
  }
}

function onCheck() {
  settleFlights();
  if (!puzzle) return;
  if (mode === "echo") {
    gate = echoGate(todayEcho());
    if (gate) {
      outcome = null;
      marks = null;
      focusAfter = "copy-link";
      render();
      return;
    }
  }
  const result = score(picked, puzzle, flat.ids);
  const line = playbackLine(result.status, puzzle.works, lines.notYet);
  if (!line) return;
  outcome = { status: result.status, line };
  marks = checkMarks(picked, puzzle);
  if (result.status === "pass") activeSave.markDone(pageId);
  shakeOnce = result.status !== "pass";
  focusAfter = "outcome";
  render();
}

function pickedCount() {
  liveText(pickedLive, "Picked " + String(picked.length));
  return pickedLive;
}

function tileButton(block, focusPrefix) {
  const on = picked.indexOf(block.id) !== -1;
  const button = el("button", {
    type: "button",
    class: on ? "tile is-picked" : "tile",
    "data-move": "1",
    "data-focus-id": focusPrefix + block.id,
    "aria-pressed": on ? "true" : "false",
  });
  button.append(paint(glyphTree(block.id)), tx(block.label));
  button.addEventListener("click", () => toggle(block.id, focusPrefix === "recent-"));
  return button;
}

function checkButton() {
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
  return check;
}

function recentRow() {
  const row = el("div", { class: "recent", role: "group", "aria-label": "Recent" });
  if (recent.length === 0) {
    row.append(el("p", { class: "recent-empty" }, [tx("None yet")]));
    return row;
  }
  for (let i = 0; i < recent.length; i += 1) {
    const id = recent[i];
    const label = flat.labels[id] || id;
    row.append(tileButton({ id, label }, "recent-"));
  }
  return row;
}

function tabButton(group) {
  const on = group.id === activeTab;
  const button = el(
    "button",
    {
      type: "button",
      class: on ? "tab is-on" : "tab",
      role: "tab",
      id: "tab-" + group.id,
      "aria-selected": on ? "true" : "false",
      "aria-controls": "tray-panel",
      tabindex: on ? "0" : "-1",
      "data-move": "1",
      "data-focus-id": "tab-" + group.id,
    },
    [tx(group.label)],
  );
  button.addEventListener("click", () => {
    activeTab = group.id;
    focusAfter = "tab-" + group.id;
    render();
  });
  return button;
}

function categoryGrids() {
  const panel = el("div", {
    class: "dock-grids",
    role: "tabpanel",
    id: "tray-panel",
    "aria-labelledby": "tab-" + activeTab,
  });
  for (let g = 0; g < tray.groups.length; g += 1) {
    const group = tray.groups[g];
    const grid = el("div", { class: "tray", role: "group", "aria-label": group.label });
    if (group.id !== activeTab) grid.hidden = true;
    const blocks = blocksFor(tray.groups, group.id);
    for (let i = 0; i < blocks.length; i += 1) grid.append(tileButton(blocks[i], "block-"));
    panel.append(grid);
  }
  return panel;
}

function setTray(open, focusId) {
  if (open && !sideBySide()) promptOpen = false;
  if (!open) {
    copyFailed = false;
    if (shareLive.textContent === "Couldn't copy. Select the address.") liveText(shareLive, "");
  }
  trayOpen = open;
  focusAfter = focusId;
  render();
}

function bagButton() {
  const button = el(
    "button",
    {
      type: "button",
      class: "bag",
      "data-move": "1",
      "data-focus-id": "tray-toggle",
      "aria-expanded": trayOpen ? "true" : "false",
      "aria-controls": "inventory",
      "aria-describedby": "picked-count",
    },
    [
      el("span", { class: "bag-icon", "aria-hidden": "true" }),
      el("span", { class: "bag-label" }, [tx("Bag")]),
    ],
  );
  button.addEventListener("click", () => {
    const open = !trayOpen;
    setTray(open, open ? "tab-" + activeTab : "tray-toggle");
  });
  return el("div", { class: "bag-wrap" }, [button, pickedCount()]);
}

function inventoryNode(extras) {
  const backdrop = el(
    "button",
    { type: "button", class: "inventory-backdrop", "data-move": "1", "data-focus-id": "inventory-dismiss" },
    [tx("Close bag")],
  );
  backdrop.addEventListener("click", () => {
    if (trayOpen) setTray(false, "tray-toggle");
  });
  const handle = el("div", { class: "dock-handle" }, [
    el("span", { class: "dock-grip", "aria-hidden": "true" }),
  ]);
  const tabs = el("div", { class: "tablist", role: "tablist", "aria-label": "Categories" });
  for (let i = 0; i < tray.groups.length; i += 1) tabs.append(tabButton(tray.groups[i]));
  const kids = [handle, recentRow(), tabs, categoryGrids()];
  const extraKids = [];
  const actionKids = [];
  for (let i = 0; i < extras.length; i += 1) {
    const node = extras[i];
    if (!node) continue;
    const id = node.getAttribute && node.getAttribute("data-focus-id");
    const nested = node.querySelector ? node.querySelector("[data-focus-id]") : null;
    const focus = id || (nested ? nested.getAttribute("data-focus-id") : "");
    if (focus === "share-link" || focus === "copy-link" || focus === "clear") actionKids.push(node);
    else extraKids.push(node);
  }
  if (extraKids.length > 0) kids.push(el("div", { class: "dock-extra" }, extraKids));
  if (copyFailed) actionKids.push(field("copy-link", "Copy link", pageAddress(window.location), "Select the address and copy it."));
  if (actionKids.length > 0) kids.push(el("div", { class: "bag-actions" }, actionKids));
  const dockAttrs = {
    class: "dock",
    role: "dialog",
    "aria-label": "Bag",
    "aria-describedby": "prompt-panel",
  };
  if (bagModal()) dockAttrs["aria-modal"] = "true";
  const dock = el("section", dockAttrs, kids);
  const inventory = el("div", { class: "inventory", id: "inventory" }, [backdrop, dock]);
  if (!trayOpen) inventory.hidden = true;
  return inventory;
}

function resultCard(row, nextLink) {
  if (!outcome || !row) return null;
  liveText(resultLive, outcome.line);
  const pass = outcome.status === "pass";
  const kids = [
    el("p", { class: "result-kicker" }, [tx(pass ? "Stage clear" : "Try again")]),
    resultLive,
    rubric(row),
  ];
  if (nextLink) kids.push(nextLink);
  return el("div", { class: pass ? "result-card is-pass" : "result-card is-miss" }, kids);
}

function shareNode() {
  if (mode !== "echo" || gate || !dailySave) return null;
  if (dailySave.doneIds().indexOf(pageId) === -1) return null;
  return field("share-card", "Share card", shareLine(pageId, lines), "Select the line and copy it.");
}

function playShell(row, extras) {
  const promptButton = el(
    "button",
    {
      type: "button",
      class: promptOpen ? "prompt-toggle is-open" : "prompt-toggle",
      "data-move": "1",
      "data-focus-id": "prompt-toggle",
      "aria-expanded": promptOpen ? "true" : "false",
      "aria-controls": "prompt-panel",
    },
    [tx(promptOpen ? "Hide prompt" : "Prompt")],
  );
  promptButton.addEventListener("click", () => {
    promptOpen = !promptOpen;
    focusAfter = "prompt-toggle";
    render();
  });
  const situation = el("p", { class: "situation", id: "prompt-panel" }, [tx(row.situation)]);
  if (!promptOpen) situation.hidden = true;
  situation.addEventListener("click", () => {
    if (!promptOpen) return;
    const selected = window.getSelection();
    if (selected && String(selected).length > 0) return;
    promptOpen = false;
    focusAfter = "prompt-toggle";
    render();
  });
  let nextLink = null;
  const menuExtras = [];
  for (let i = 0; i < extras.length; i += 1) {
    const node = extras[i];
    if (!node) continue;
    if (node.getAttribute && node.getAttribute("data-focus-id") === "next") nextLink = node;
    else menuExtras.push(node);
  }
  return el("div", { class: trayOpen ? "play is-open" : "play" }, [
    el("div", { class: "stage" }, [
      sceneNode(currentPlan()),
      el("div", { class: "hud" }, [
        el("h2", {}, [tx(mode === "solo" ? row.title : "Echo " + pageId)]),
        el("div", { class: promptOpen ? "dialogue is-open" : "dialogue" }, [promptButton, situation]),
        resultCard(row, nextLink),
      ]),
      el("div", { class: "hud-actions" }, [bagButton(), checkButton()]),
    ]),
    inventoryNode(menuExtras),
  ]);
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
    const extras = [];
    if (mode === "solo" && soloSave.doneIds().indexOf(pageId) !== -1) {
      const index = solo.items.findIndex((item) => String(item.id) === pageId);
      const next = solo.items[index + 1];
      if (next) extras.push(linkNode({ id: "next", href: soloPath(next.id), label: "Next puzzle" }));
    }
    extras.push(shareNode());
    if (mode === "echo") extras.push(streakNode(todayEcho()));
    extras.push(shareControl());
    extras.push(clearButton());
    nodes.push(playShell(puzzle, extras));
  }

  return nodes.filter((node) => node != null);
}

function render() {
  const keep = focusAfter || (document.activeElement && document.activeElement.getAttribute("data-focus-id"));
  focusAfter = null;
  const nodes = view();
  app.replaceChildren();
  for (let i = 0; i < nodes.length; i += 1) app.append(nodes[i]);
  const playing = Boolean(puzzle) && !gate && (mode === "solo" || mode === "echo");
  app.classList.toggle("is-play", playing);
  const outside = app.querySelectorAll(".mast, .hud, .scene");
  const modal = playing && bagModal();
  for (let i = 0; i < outside.length; i += 1) outside[i].inert = modal;
  if (shakeOnce) {
    shakeOnce = false;
    const stage = app.querySelector(".stage");
    if (stage && !prefersReduced()) {
      stage.classList.add("is-shake");
      stage.addEventListener("animationend", () => {
        stage.classList.remove("is-shake");
      }, { once: true });
    }
  }
  if (keep) {
    const next = app.querySelector('[data-focus-id="' + keep + '"]');
    if (next) {
      next.focus();
      if (keep === "copy-link" && next.select) next.select();
    }
  }
}

function dialogFocusables(dialog) {
  const nodes = dialog.querySelectorAll("a, button, input, [tabindex]");
  const list = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.closest("[hidden]")) continue;
    if (node.disabled) continue;
    if (node.tabIndex < 0) continue;
    list.push(node);
  }
  return list;
}

document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("is-hidden", document.hidden);
});

bindInput();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && trayOpen) {
    event.preventDefault();
    setTray(false, "tray-toggle");
    return;
  }
  if (event.key !== "Tab" || !bagModal()) return;
  const dialog = document.querySelector(".dock");
  if (!dialog) return;
  const list = dialogFocusables(dialog);
  if (list.length === 0) return;
  const index = list.indexOf(document.activeElement);
  event.preventDefault();
  let next = 0;
  if (event.shiftKey) next = index <= 0 ? list.length - 1 : index - 1;
  else if (index >= 0 && index < list.length - 1) next = index + 1;
  list[next].focus();
});

window.matchMedia("(orientation: landscape) and (min-width: 560px)").addEventListener("change", () => {
  if (!trayOpen) return;
  const id = document.activeElement && document.activeElement.getAttribute("data-focus-id");
  if (id) focusAfter = id;
  render();
});

let swipeStart = null;
document.addEventListener("pointerdown", (event) => {
  const handle = event.target && event.target.closest && event.target.closest(".dock-handle");
  if (!handle || !trayOpen) {
    swipeStart = null;
    return;
  }
  swipeStart = event.clientY;
});
document.addEventListener("pointerup", (event) => {
  if (swipeStart == null || !trayOpen) return;
  const delta = event.clientY - swipeStart;
  swipeStart = null;
  if (delta > 48) setTray(false, "tray-toggle");
});
document.addEventListener("pointercancel", () => {
  swipeStart = null;
});

render();
