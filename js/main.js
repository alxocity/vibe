import {
  bumpScale,
  bumpTurn,
  closeness,
  degrees,
  panPose,
  poseTransform,
  restPose,
  samePose,
  scalePose,
  span,
  turnPose,
} from "./arrange.js";
import { calendar, echoes, lines, playback, solo, tray } from "./catalog.js";
import { PLACE, glyphTree, scenePlan, sceneTree, shareGlyph } from "./draw.js";
import { ghostIds, showGhosts } from "./ghosts.js";
import { el, tx } from "./dom.js";
import { ACTION_MS, flightPlan, playFly } from "./motion.js";
import { paint } from "./paint.js";
import { blocksFor, checkMarks, toggleId } from "./picker.js";
import { echoId, score } from "./score.js";
import { bindInput } from "./input.js";
import { echoHref, linksFor } from "./nav.js";
import { pageAddress, soloPath } from "./paths.js";
import { playbackLine } from "./playback.js";
import { echoGateStatus, liveEchoIds, practiceEcho, shareLine, visibleStreak } from "./progress.js";
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

function replayRow(today) {
  return practiceEcho(echoes.items, today, withdrawn);
}

function practicing() {
  const row = replayRow(todayEcho());
  return row != null && String(row.id) === String(pageId);
}

function echoGate(today) {
  const replay = replayRow(today);
  if (replay && String(replay.id) === String(pageId)) return null;
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
let poses = Object.create(null);
let selected = null;
let outcome = null;
let resultOpen = false;
let keyOpen = false;
let gate = mode === "echo" ? echoGate(todayEcho()) : null;
let focusAfter = null;
let activeTab = tray.groups.length ? tray.groups[0].id : "";
let trayOpen = false;
let promptOpen = true;
let menuOpen = false;
let resetArmed = false;
let shakeOnce = false;
let marks = null;
const arriving = Object.create(null);
const flyers = Object.create(null);
const flyerToken = Object.create(null);

if (activeSave && puzzle && !gate && !practicing()) {
  picked = activeSave.picked(pageId);
  poses = activeSave.posed(pageId);
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
const resultHold = el("div", { class: "result-live" });
resultHold.append(resultLive);
const resultPanel = el("div", { id: "result-panel", class: "result-slot" });
resultPanel.hidden = true;
resultPanel.append(resultHold);
const resultRoot = el("div", { id: "result-root" });
resultRoot.append(resultPanel);
resultRoot.append(shareLive);
document.body.append(resultRoot);

function liveText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;
}

const sideBySideQuery = "(orientation: landscape) and (min-width: 360px)";

function sideBySide() {
  return window.matchMedia(sideBySideQuery).matches === true;
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
  liveText(shareLive, "Couldn't copy. Select the address.");
  if (!menuOpen) return;
  copyFailed = true;
  resetArmed = false;
  focusAfter = "copy-link";
  render();
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
    if (menuOpen) closeMenu("play-menu");
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
  pending.then(() => {
    if (menuOpen) closeMenu("play-menu");
  }, (error) => {
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
    [paint(shareGlyph()), el("span", {}, [tx(name)])],
  );
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    sharePage(url);
  });
  return button;
}

function wipeProgress() {
  settleFlights();
  activeSave.clearAll();
  picked = [];
  poses = Object.create(null);
  selected = null;
  outcome = null;
  resultOpen = false;
  keyOpen = false;
  marks = null;
  promptOpen = true;
  menuOpen = false;
  resetArmed = false;
  copyFailed = false;
}

function closeMenu(focus) {
  menuOpen = false;
  resetArmed = false;
  copyFailed = false;
  if (shareLive.textContent === "Couldn't copy. Select the address.") liveText(shareLive, "");
  focusAfter = focus || "play-menu";
  render();
}

function clearButton() {
  const button = el(
    "button",
    { type: "button", class: "action action-quiet", "data-move": "1", "data-focus-id": "clear" },
    [tx(lines.clear)],
  );
  button.addEventListener("click", () => {
    wipeProgress();
    focusAfter = "clear";
    render();
  });
  return button;
}

function menuButton() {
  const button = el(
    "button",
    {
      type: "button",
      class: "menu-toggle",
      "data-move": "1",
      "data-focus-id": "play-menu",
      "aria-expanded": menuOpen ? "true" : "false",
      "aria-controls": "play-menu",
      "aria-label": "Menu",
    },
    [el("span", { class: "menu-icon", "aria-hidden": "true" })],
  );
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menuOpen) closeMenu("play-menu");
    else {
      menuOpen = true;
      focusAfter = "play-menu";
      render();
    }
  });
  return button;
}

function resetControl() {
  if (!resetArmed) {
    const arm = el(
      "button",
      { type: "button", class: "menu-item", "data-move": "1", "data-focus-id": "reset" },
      [tx("Reset progress")],
    );
    arm.addEventListener("click", (event) => {
      event.stopPropagation();
      resetArmed = true;
      menuOpen = true;
      focusAfter = "clear";
      render();
    });
    return arm;
  }
  const confirm = el(
    "button",
    { type: "button", class: "menu-item", "data-move": "1", "data-focus-id": "clear" },
    [tx(lines.clear)],
  );
  confirm.addEventListener("click", (event) => {
    event.stopPropagation();
    wipeProgress();
    focusAfter = "play-menu";
    render();
  });
  return confirm;
}

function menuPanel() {
  const wrap = el("div", { class: "share-wrap" }, [shareButton()]);
  if (menuOpen) wrap.append(shareLive);
  const kids = [wrap, resetControl()];
  if (menuOpen && copyFailed) {
    kids.push(field("copy-link", "Copy link", pageAddress(window.location), "Select the address and copy it."));
  }
  const panel = el("div", { id: "play-menu", class: "play-menu", role: "group", "aria-label": "Menu" }, kids);
  if (!menuOpen) panel.hidden = true;
  return panel;
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

function toolsTree() {
  function handle(name, label) {
    return {
      tag: "g",
      attrs: {
        "data-handle": name,
        role: "button",
        tabindex: "0",
        "aria-label": label,
        "data-move": "1",
        "data-focus-id": "pose-" + name,
      },
      kids: [
        { tag: "rect", attrs: { width: "44", height: "44", rx: "6" } },
        {
          tag: "text",
          attrs: { x: "22", y: "28", "text-anchor": "middle", "font-size": "12", "pointer-events": "none" },
          text: label,
        },
      ],
    };
  }
  return {
    tag: "svg",
    attrs: { class: "scene-tools", viewBox: "0 0 1 1", role: "group", "aria-label": "Placement" },
    kids: [
      { tag: "rect", attrs: { class: "select-box", x: "0", y: "0", width: "1", height: "1" } },
      handle("size", "Size"),
      handle("turn", "Turn"),
    ],
  };
}

function sceneNode(plan) {
  const picture = paint(sceneTree(plan));
  picture.classList.add("scene-picture");
  const kids = [picture];
  if (selected && plan.order.indexOf(selected) !== -1) kids.push(paint(toolsTree()));
  kids.push(el("figcaption", {}, [tx(sceneLabel(plan.order))]));
  const figure = el("figure", { class: "scene" }, kids);
  if (selected) {
    const layer = figure.querySelector('[data-layer="' + selected + '"]');
    if (layer) layer.classList.add("is-selected");
  }
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
  plan.poses = poses;
  if (puzzle && typeof puzzle.backdrop === "string" && puzzle.backdrop) plan.backdrop = puzzle.backdrop;
  const missed = marks ? marks.missed : [];
  const ghosts = ghostIds(missed, showGhosts);
  if (ghosts.length > 0) plan.ghosts = ghosts;
  return plan;
}

function toggle(id) {
  if (mode === "echo") {
    gate = echoGate(todayEcho());
    if (gate) {
      outcome = null;
      resultOpen = false;
      keyOpen = false;
      marks = null;
      focusAfter = "copy-link";
      render();
      return;
    }
  }
  const adding = picked.indexOf(id) === -1;
  const firstPick = adding && picked.length === 0;
  const origin = blockNode(id);
  const from = boxOf(adding ? origin : layerNode(id));
  picked = toggleId(picked, id);
  if (!adding) {
    delete poses[id];
    if (selected === id) selected = null;
    rememberPoses();
  }
  if (firstPick) promptOpen = false;
  outcome = null;
  resultOpen = false;
  keyOpen = false;
  marks = null;
  if (!practicing()) activeSave.setPicked(pageId, picked);
  focusAfter = "block-" + id;
  if (adding) arriving[id] = true;
  else delete arriving[id];
  render();
  const back = blockNode(id);
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
      resultOpen = false;
      keyOpen = false;
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
  const near = closeness(picked, poses, puzzle.arrange, flat.ids, PLACE);
  if (near) outcome.near = near;
  resultOpen = true;
  keyOpen = false;
  trayOpen = false;
  marks = checkMarks(picked, puzzle);
  if (result.status === "pass" && !practicing()) activeSave.markDone(pageId);
  shakeOnce = result.status !== "pass";
  focusAfter = "outcome";
  render();
}

function resultTally(row) {
  const required = row && Array.isArray(row.required) ? row.required : [];
  const anyOf = row && Array.isArray(row.anyOf) ? row.anyOf : [];
  const need = required.length + (anyOf.length > 0 ? 1 : 0);
  const correct = marks && marks.correct ? marks.correct : [];
  let got = 0;
  for (let i = 0; i < required.length; i += 1) {
    if (correct.indexOf(required[i]) !== -1) got += 1;
  }
  if (anyOf.length > 0) {
    for (let i = 0; i < anyOf.length; i += 1) {
      if (correct.indexOf(anyOf[i]) !== -1) {
        got += 1;
        break;
      }
    }
  }
  if (outcome && outcome.status === "pass") got = need;
  return String(got) + "/" + String(need);
}

function resultScore(row) {
  if (marks && marks.wrong && marks.wrong.length > 0 && (!outcome || outcome.status !== "pass")) return "";
  return resultTally(row);
}

function resultPhrase(pass, score) {
  const word = pass ? "Clear" : "Miss";
  if (!score) return word;
  return word + " " + score;
}

function focusResult(id) {
  window.setTimeout(() => {
    const node = document.querySelector('[data-focus-id="' + id + '"]');
    if (node) node.focus();
  }, 0);
}

function dismissResult() {
  if (!outcome || !resultOpen) return;
  resultOpen = false;
  keyOpen = false;
  focusAfter = "result-badge";
  render();
  focusResult("result-badge");
}

function showResult() {
  if (!outcome) return;
  resultOpen = true;
  trayOpen = false;
  focusAfter = "result-badge";
  render();
  focusResult("result-badge");
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
  button.addEventListener("click", () => toggle(block.id));
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
  if (open && !sideBySide()) {
    promptOpen = false;
    keyOpen = false;
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
  const kids = [handle, tabs, categoryGrids()];
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
  if (actionKids.length > 0) kids.push(el("div", { class: "bag-actions" }, actionKids));
  const dock = el("section", {
    class: "dock",
    role: "dialog",
    "aria-label": "Bag",
    "aria-describedby": "prompt-panel",
  }, kids);
  const inventory = el("div", { class: "inventory", id: "inventory" }, [backdrop, dock]);
  if (!trayOpen) inventory.hidden = true;
  return inventory;
}

function resultToggle(pass, score) {
  const phrase = resultPhrase(pass, score);
  const tone = pass ? "is-pass" : "is-miss";
  const kids = [];
  if (resultOpen) kids.push(tx("Close"));
  else {
    kids.push(el("span", { class: "result-mark", "aria-hidden": "true" }, [tx(pass ? "Clear" : "Miss")]));
    if (score) kids.push(el("span", { class: "result-score" }, [tx(score)]));
  }
  const button = el(
    "button",
    {
      type: "button",
      class: resultOpen ? "result-badge result-close " + tone : "result-badge " + tone,
      "data-move": "1",
      "data-focus-id": "result-badge",
      "aria-expanded": resultOpen ? "true" : "false",
      "aria-controls": "result-panel",
      "aria-label": resultOpen ? "Close result" : phrase + ". Show result",
    },
    kids,
  );
  button.addEventListener("click", () => {
    if (resultOpen) dismissResult();
    else showResult();
  });
  return button;
}

function resultKeyButton() {
  const button = el(
    "button",
    {
      type: "button",
      class: "result-key",
      "data-move": "1",
      "data-focus-id": "result-key",
      "aria-expanded": keyOpen ? "true" : "false",
      "aria-controls": "result-key-panel",
    },
    [tx(keyOpen ? "Hide key" : "Show key")],
  );
  button.addEventListener("click", () => {
    keyOpen = !keyOpen;
    if (keyOpen) {
      trayOpen = false;
      if (!sideBySide()) promptOpen = false;
    }
    focusAfter = "result-key";
    render();
  });
  return button;
}

function clearPanelExtras() {
  for (let i = resultPanel.childNodes.length - 1; i >= 0; i -= 1) {
    if (resultPanel.childNodes[i] !== resultHold) resultPanel.removeChild(resultPanel.childNodes[i]);
  }
}

function nearLabel(near) {
  const word = near.band === "exact" ? "Exact" : near.band === "close" ? "Close" : near.band === "near" ? "Near" : "Far";
  return word + " " + String(near.value);
}

function resultKicker(pass, score, near) {
  const word = pass ? "Clear" : "Miss";
  const kids = [el("span", { class: "result-word" }, [tx(word)])];
  if (score) kids.push(el("span", { class: "result-fraction" }, [tx(" " + score)]));
  if (near) kids.push(el("span", { class: "result-near" }, [tx(" " + nearLabel(near))]));
  return el("p", { class: "result-kicker" }, kids);
}

function syncResult(row, nextLink) {
  if (!outcome || !row) {
    resultPanel.hidden = true;
    resultPanel.className = "result-slot";
    resultPanel.removeAttribute("data-near");
    resultPanel.removeAttribute("data-band");
    clearPanelExtras();
    return;
  }
  liveText(resultLive, outcome.line);
  const pass = outcome.status === "pass";
  const score = resultScore(row);
  const near = outcome.near || null;
  if (near) {
    resultPanel.setAttribute("data-near", String(near.value));
    resultPanel.setAttribute("data-band", near.band);
  } else {
    resultPanel.removeAttribute("data-near");
    resultPanel.removeAttribute("data-band");
  }
  if (resultHold.parentElement !== resultPanel) resultPanel.insertBefore(resultHold, resultPanel.firstChild);
  resultPanel.className = resultOpen
    ? "result-slot is-open result-card " + (pass ? "is-pass" : "is-miss") + (keyOpen ? " is-key" : "")
    : "result-slot";
  resultPanel.hidden = false;
  clearPanelExtras();
  if (!resultOpen) {
    resultPanel.append(resultToggle(pass, score));
    return;
  }
  const detail = el("div", { id: "result-key-panel", class: "result-detail" });
  if (keyOpen) {
    detail.append(rubric(row));
    if (nextLink) detail.append(nextLink);
  } else detail.hidden = true;
  resultPanel.append(detail, resultKicker(pass, score, near), resultKeyButton(), resultToggle(pass, score));
}

function shareNode() {
  if (mode !== "echo" || gate || !dailySave || practicing()) return null;
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
      "aria-label": "Prompt",
    },
    [
      el("span", { class: "prompt-icon", "aria-hidden": "true" }),
      el("span", { class: "prompt-label" }, [tx("Prompt")]),
    ],
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
  syncResult(row, nextLink);
  return el("div", { class: trayOpen ? "play is-open" : "play" }, [
    el("div", { class: "stage" }, [
      el("div", { class: "hud" }, [
        el("div", { class: "hud-bar" }, [
          el("h2", {}, [tx(practicing() ? "Practice" : mode === "solo" ? row.title : "Echo " + pageId)]),
          practicing() ? el("p", { class: "practice" }, [tx(lines.practice)]) : null,
        ].filter((node) => node != null)),
        el("div", { class: promptOpen ? "dialogue is-open" : "dialogue" }, [promptButton, situation]),
      ]),
      sceneNode(currentPlan()),
      el("div", { class: "result-gap" }),
      menuButton(),
      menuPanel(),
      inventoryNode(menuExtras),
      el("div", { class: "hud-actions" }, [bagButton(), checkButton()]),
    ]),
  ]);
}

function view() {
  const nodes = [mast(), warningNode()];
  const today = todayEcho();
  const todayRow = rowById(echoes.items, today);
  const todayOpen = echoGateStatus(todayRow, today, today, withdrawn) == null;
  const replay = replayRow(today);

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
    if (todayOpen) {
      nodes.push(el("p", { class: "echo-id" }, [tx("Echo " + today)]));
      nodes.push(linkNode({ id: "today", href: echoHref(today), label: "Open today" }));
      nodes.push(field("copy-link", "Copy link", pageAddress({ origin: window.location.origin, pathname: echoHref(today) }), "Select the address and copy it."));
    } else if (replay) {
      nodes.push(el("p", { class: "frame" }, [tx(lines.practice)]));
      nodes.push(el("p", { class: "echo-id" }, [tx("Echo " + replay.id)]));
      nodes.push(linkNode({ id: "replay", href: echoHref(replay.id), label: lines.replay }));
      nodes.push(field("copy-link", "Copy link", pageAddress({ origin: window.location.origin, pathname: echoHref(replay.id) }), "Select the address and copy it."));
    } else nodes.push(el("p", { class: "frame" }, [tx(lines.noPuzzle)]));
    nodes.push(streakNode(today));
    if (!todayOpen && !replay) nodes.push(copyLink());
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
    nodes.push(playShell(puzzle, extras));
  }

  return nodes.filter((node) => node != null);
}

function controlShown(node) {
  if (!node) return false;
  if (node.hidden) return false;
  if (node.closest && node.closest("[hidden]")) return false;
  const style = window.getComputedStyle(node);
  return style.display !== "none" && style.visibility !== "hidden";
}

function focusShown(id) {
  if (!id) return false;
  const node = document.querySelector('[data-focus-id="' + id + '"]');
  if (!node || !controlShown(node)) return false;
  node.focus();
  if (id === "copy-link" && node.select) node.select();
  return document.activeElement === node;
}

function render() {
  if (!menuOpen) resultRoot.append(shareLive);
  const used = focusAfter;
  const keep = focusAfter || (document.activeElement && document.activeElement.getAttribute("data-focus-id"));
  focusAfter = null;
  const nodes = view();
  app.replaceChildren();
  for (let i = 0; i < nodes.length; i += 1) app.append(nodes[i]);
  const playing = Boolean(puzzle) && !gate && (mode === "solo" || mode === "echo");
  app.classList.toggle("is-play", playing);
  const resultShown = resultPanel.hidden !== true;
  const resultOpenPanel = resultShown && resultPanel.classList.contains("is-open");
  document.documentElement.classList.toggle("is-badge", resultShown && !resultOpenPanel);
  document.documentElement.classList.toggle("is-result", resultOpenPanel);
  document.documentElement.classList.toggle("is-key", resultShown && resultPanel.classList.contains("is-key"));
  const bagOpen = playing && trayOpen;
  app.classList.toggle("is-bag", bagOpen);
  document.documentElement.classList.toggle("is-bag", bagOpen);
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
  if (keep && !focusShown(keep) && !focusShown(used)) focusShown("tray-toggle");
  placeTools();
}

document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("is-hidden", document.hidden);
});

function currentPose(id) {
  if (poses[id]) return poses[id];
  const place = PLACE[id];
  if (!place) return null;
  return restPose(place);
}

function rememberPoses() {
  if (!activeSave || !puzzle || gate || practicing()) return;
  activeSave.setPosed(pageId, poses);
}

function commitPose(id) {
  const place = PLACE[id];
  if (place && poses[id] && samePose(poses[id], restPose(place))) delete poses[id];
  rememberPoses();
}

function placeTools() {
  const scene = document.querySelector(".scene");
  const tools = document.querySelector(".scene-tools");
  const piece = selected ? document.querySelector('.scene [data-layer="' + selected + '"]') : null;
  if (!scene || !tools || !piece) return;
  const host = scene.getBoundingClientRect();
  const w = Math.round(host.width);
  const h = Math.round(host.height);
  if (!(w > 1) || !(h > 1)) return;
  tools.setAttribute("viewBox", "0 0 " + String(w) + " " + String(h));
  const box = piece.getBoundingClientRect();
  const left = box.left - host.left;
  const top = box.top - host.top;
  const frame = tools.querySelector(".select-box");
  if (frame) {
    frame.setAttribute("x", String(Math.round(left)));
    frame.setAttribute("y", String(Math.round(top)));
    frame.setAttribute("width", String(Math.max(1, Math.round(box.width))));
    frame.setAttribute("height", String(Math.max(1, Math.round(box.height))));
  }
  function moveHandle(node, x, y) {
    if (!node) return;
    let px = Math.round(x);
    let py = Math.round(y);
    if (px < 0) px = 0;
    if (py < 0) py = 0;
    if (px > w - 44) px = Math.max(0, w - 44);
    if (py > h - 44) py = Math.max(0, h - 44);
    node.setAttribute("transform", "translate(" + String(px) + " " + String(py) + ")");
  }
  moveHandle(tools.querySelector('[data-handle="turn"]'), w - 96, 4);
  moveHandle(tools.querySelector('[data-handle="size"]'), w - 48, 4);
}

function paintPose(id) {
  const layer = document.querySelector('.scene [data-layer="' + id + '"]');
  if (!layer || !poses[id]) return;
  layer.setAttribute("transform", poseTransform(poses[id]));
  placeTools();
}

function pictureSvg() {
  return document.querySelector(".scene-picture");
}

function sceneFromClient(svg, clientX, clientY) {
  if (!svg || !svg.createSVGPoint || !svg.getScreenCTM) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const local = pt.matrixTransform(ctm.inverse());
  if (!Number.isFinite(local.x) || !Number.isFinite(local.y)) return null;
  return { x: Math.round(local.x * 10), y: Math.round(local.y * 10) };
}

let poseGesture = null;
let poseBackground = null;
const posePointers = Object.create(null);
let poseShow = 0;

function showPose() {
  poseShow += 1;
  const token = poseShow;
  window.setTimeout(() => {
    if (token !== poseShow) return;
    render();
  }, 0);
}

function poseLayerId(target) {
  if (!target || !target.closest) return null;
  const layer = target.closest(".scene [data-layer]");
  if (!layer) return null;
  return layer.getAttribute("data-layer");
}

bindInput();

document.addEventListener("keydown", (event) => {
  const node = document.activeElement;
  const kind = node && node.getAttribute && node.getAttribute("data-handle");
  if (!kind || !selected || picked.indexOf(selected) === -1) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const pose = currentPose(selected);
    if (!pose) return;
    poses[selected] = kind === "size" ? bumpScale(pose) : bumpTurn(pose);
    commitPose(selected);
    render();
    return;
  }
  let dx = 0;
  let dy = 0;
  if (event.key === "ArrowLeft") dx = -10;
  else if (event.key === "ArrowRight") dx = 10;
  else if (event.key === "ArrowUp") dy = -10;
  else if (event.key === "ArrowDown") dy = 10;
  else return;
  event.preventDefault();
  event.stopPropagation();
  const pose = currentPose(selected);
  if (!pose) return;
  poses[selected] = panPose(pose, dx, dy);
  commitPose(selected);
  render();
}, true);

document.addEventListener("pointerdown", (event) => {
  if (event.button != null && event.button !== 0) return;
  const target = event.target;
  if (!target || !target.closest) return;
  if (!target.closest(".scene")) return;
  const svg = pictureSvg();
  const point = sceneFromClient(svg, event.clientX, event.clientY);
  if (poseGesture && point) {
    posePointers[event.pointerId] = point;
    const ids = Object.keys(posePointers);
    if (ids.length >= 2) {
      const origin = currentPose(poseGesture.id) || poseGesture.origin;
      const startDist = span(posePointers[ids[0]], posePointers[ids[1]]);
      poseGesture = {
        kind: "pinch",
        id: poseGesture.id,
        origin,
        start: point,
        startClient: { x: event.clientX, y: event.clientY },
        startDist: startDist < 40 ? 40 : startDist,
        startAngle: 0,
        moved: true,
      };
    }
    return;
  }
  const handle = target.closest("[data-handle]");
  const id = handle ? selected : poseLayerId(target);
  if (!id || picked.indexOf(id) === -1 || arriving[id] || !point) {
    if (!handle && selected) poseBackground = { id: event.pointerId, x: event.clientX, y: event.clientY };
    return;
  }
  const origin = currentPose(id);
  if (!origin) return;
  posePointers[event.pointerId] = point;
  const kind = handle ? handle.getAttribute("data-handle") : "move";
  const startDist = span(point, origin);
  poseGesture = {
    kind,
    id,
    origin,
    start: point,
    startClient: { x: event.clientX, y: event.clientY },
    startDist: startDist < 40 ? 40 : startDist,
    startAngle: degrees(origin.x, origin.y, point.x, point.y),
    moved: false,
  };
  if (selected !== id) {
    selected = id;
    const tools = document.querySelector(".scene-tools");
    if (tools) tools.remove();
  }
  const cap = target.setPointerCapture ? target : svg;
  if (cap && cap.setPointerCapture) {
    try {
      cap.setPointerCapture(event.pointerId);
    } catch {
      /* capture is optional */
    }
  }
});

document.addEventListener("pointermove", (event) => {
  if (!poseGesture || !posePointers[event.pointerId]) return;
  const svg = pictureSvg();
  const point = sceneFromClient(svg, event.clientX, event.clientY);
  if (!point) return;
  posePointers[event.pointerId] = point;
  const gesture = poseGesture;
  const dx = event.clientX - gesture.startClient.x;
  const dy = event.clientY - gesture.startClient.y;
  if (dx * dx + dy * dy >= 64) gesture.moved = true;
  if (!gesture.moved) return;
  let next = gesture.origin;
  if (gesture.kind === "move") {
    next = panPose(gesture.origin, point.x - gesture.start.x, point.y - gesture.start.y);
  } else if (gesture.kind === "size" || gesture.kind === "pinch") {
    const ids = Object.keys(posePointers);
    const dist = gesture.kind === "pinch" && ids.length >= 2 ? span(posePointers[ids[0]], posePointers[ids[1]]) : span(point, gesture.origin);
    next = scalePose(gesture.origin, gesture.startDist, dist);
  } else if (gesture.kind === "turn") {
    next = turnPose(gesture.origin, gesture.startAngle, degrees(gesture.origin.x, gesture.origin.y, point.x, point.y));
  }
  poses[gesture.id] = next;
  paintPose(gesture.id);
  if (event.cancelable) event.preventDefault();
}, { passive: false });

function clearPosePointers() {
  const names = Object.keys(posePointers);
  for (let i = 0; i < names.length; i += 1) delete posePointers[names[i]];
}

function endPoseGesture(event) {
  if (poseBackground && poseBackground.id === event.pointerId) {
    const dx = event.clientX - poseBackground.x;
    const dy = event.clientY - poseBackground.y;
    poseBackground = null;
    if (dx * dx + dy * dy < 64 && !poseGesture && selected) {
      selected = null;
      showPose();
    }
    return;
  }
  delete posePointers[event.pointerId];
  if (!poseGesture) return;
  clearPosePointers();
  const gesture = poseGesture;
  poseGesture = null;
  if (gesture.moved) commitPose(gesture.id);
  else if (gesture.kind === "size") {
    poses[gesture.id] = bumpScale(gesture.origin);
    commitPose(gesture.id);
  } else if (gesture.kind === "turn") {
    poses[gesture.id] = bumpTurn(gesture.origin);
    commitPose(gesture.id);
  }
  selected = gesture.id;
  showPose();
}

document.addEventListener("pointerup", endPoseGesture);
document.addEventListener("pointercancel", (event) => {
  if (poseBackground && poseBackground.id === event.pointerId) poseBackground = null;
  delete posePointers[event.pointerId];
  if (!poseGesture) return;
  clearPosePointers();
  const gesture = poseGesture;
  poseGesture = null;
  if (gesture.moved) commitPose(gesture.id);
});

window.addEventListener("resize", () => {
  placeTools();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && trayOpen) {
    event.preventDefault();
    setTray(false, "tray-toggle");
    return;
  }
  if (event.key === "Escape" && menuOpen) {
    event.preventDefault();
    closeMenu("play-menu");
    return;
  }
  if (event.key === "Escape" && resultOpen) {
    event.preventDefault();
    dismissResult();
  }
});

let focusSeen = "";
document.addEventListener("focusin", (event) => {
  const id = event.target && event.target.getAttribute && event.target.getAttribute("data-focus-id");
  if (id) focusSeen = id;
});

window.matchMedia(sideBySideQuery).addEventListener("change", () => {
  if (!trayOpen) return;
  const active = document.activeElement;
  const id = active && active.getAttribute && active.getAttribute("data-focus-id");
  focusAfter = id || focusSeen || "tray-toggle";
  render();
});

let swipeStart = null;
document.addEventListener("click", (event) => {
  const target = event.target;
  if (menuOpen && target && target.closest) {
    const inMenu = target.closest("#play-menu") || target.closest('[data-focus-id="play-menu"]');
    if (!inMenu) {
      closeMenu("play-menu");
      return;
    }
  }
  if (!resultOpen || !outcome) return;
  if (!target || !target.closest) return;
  if (target.closest(".result-card")) return;
  if (target.closest(".result-badge")) return;
  if (target.closest("[data-handle]")) return;
  if (target.closest("button, a, input, textarea, select, label")) return;
  if (target.closest(".scene")) dismissResult();
});

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
