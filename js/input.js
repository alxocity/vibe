import { columnIndex, gridIndex, sameColumn } from "./paths.js";

function movers() {
  return Array.from(document.querySelectorAll("[data-move]")).filter((node) => !node.closest("[hidden]"));
}

function columnCount(grid) {
  const style = getComputedStyle(grid);
  if (style.display !== "grid") {
    const flow = style.flexDirection;
    if (flow === "column" || flow === "column-reverse") return 1;
    const count = grid.querySelectorAll(":scope > [data-move]").length;
    return count > 0 ? count : 1;
  }
  const template = style.gridTemplateColumns;
  if (!template || template === "none") return 1;
  const parts = template.trim().split(/\s+/);
  return parts.length > 1 ? parts.length : 1;
}

function tilesOf(grid) {
  return Array.from(grid.querySelectorAll("[data-move]"));
}

function focusOutside(grid, direction) {
  const all = movers();
  const tiles = tilesOf(grid);
  if (tiles.length === 0) return;
  const edge = direction === "down" ? tiles[tiles.length - 1] : tiles[0];
  const at = all.indexOf(edge);
  let step = direction === "down" ? 1 : -1;
  for (let i = at + step; i >= 0 && i < all.length; i += step) {
    if (!all[i].closest(".tray")) {
      all[i].focus();
      return;
    }
  }
}

function focusMove(direction) {
  const current = document.activeElement;
  const grid = current && current.closest ? current.closest(".tray") : null;
  if (grid && (direction === "up" || direction === "down" || direction === "left" || direction === "right")) {
    const vertical = direction === "up" || direction === "down";
    const tiles = tilesOf(grid);
    const index = tiles.indexOf(current);
    const cols = columnCount(grid);
    if (vertical) {
      const next = gridIndex(index, tiles.length, cols, direction);
      if (next >= 0 && tiles[next]) {
        tiles[next].focus();
        return;
      }
      const grids = Array.from(document.querySelectorAll(".tray"));
      const slot = grids.indexOf(grid);
      const step = direction === "down" ? 1 : -1;
      let neighbor = null;
      for (let i = slot + step; i >= 0 && i < grids.length; i += step) {
        if (!grids[i].hidden) {
          neighbor = grids[i];
          break;
        }
      }
      if (neighbor) {
        const other = tilesOf(neighbor);
        const at = sameColumn(other.length, columnCount(neighbor), columnIndex(index, cols), direction === "down" ? "start" : "end");
        if (at >= 0 && other[at]) {
          other[at].focus();
          return;
        }
      }
      focusOutside(grid, direction);
      return;
    }
  }
  const list = movers();
  const delta = direction === "left" || direction === "up" ? -1 : 1;
  const index = list.indexOf(current);
  const next = gridIndex(index, list.length, 1, delta > 0 ? "right" : "left");
  if (next >= 0 && list[next]) list[next].focus();
  else if (index < 0 && list.length > 0) list[delta > 0 ? 0 : list.length - 1].focus();
}

function moveTab(direction) {
  const current = document.activeElement;
  if (!current || !current.getAttribute || current.getAttribute("role") !== "tab") return false;
  const tabs = Array.from(document.querySelectorAll("[role='tab']"));
  const index = tabs.indexOf(current);
  if (index < 0 || tabs.length === 0) return false;
  if (direction === "home") {
    tabs[0].click();
    return true;
  }
  if (direction === "end") {
    tabs[tabs.length - 1].click();
    return true;
  }
  if (direction !== "left" && direction !== "right") return false;
  const step = direction === "right" ? 1 : -1;
  let next = index + step;
  if (next < 0) next = tabs.length - 1;
  if (next >= tabs.length) next = 0;
  tabs[next].click();
  return true;
}

function onKey(event) {
  const key = event.key;
  let direction = null;
  if (key === "ArrowDown") direction = "down";
  else if (key === "ArrowUp") direction = "up";
  else if (key === "ArrowRight") direction = "right";
  else if (key === "ArrowLeft") direction = "left";
  else if (key === "Home") direction = "home";
  else if (key === "End") direction = "end";
  else return;
  if (direction === "home" || direction === "end") {
    if (moveTab(direction)) event.preventDefault();
    return;
  }
  const el = document.activeElement;
  if (el && el.tagName === "INPUT" && el.readOnly) {
    event.preventDefault();
    focusMove(direction);
    return;
  }
  event.preventDefault();
  if (moveTab(direction)) return;
  focusMove(direction);
}

function edge(previous, name, on) {
  const was = previous[name] === true;
  previous[name] = on;
  return on && !was;
}

export function padAction(button) {
  if (button === 0) return "activate";
  if (button === 1) return "back";
  if (button === 12) return "up";
  if (button === 13) return "down";
  if (button === 14) return "left";
  if (button === 15) return "right";
  return null;
}

export function canActivate(el) {
  if (!el || typeof el.click !== "function") return false;
  if (el.disabled) return false;
  if (el.getAttribute && el.getAttribute("aria-disabled") === "true") return false;
  return true;
}

function goBack() {
  const home = document.querySelector('[data-focus-id="home"]');
  if (home && typeof home.click === "function") home.click();
}

function gamepadTick(previous, nav) {
  if (!nav.getGamepads) return;
  const pads = nav.getGamepads();
  let pad = null;
  for (let i = 0; i < pads.length; i += 1) {
    if (pads[i]) pad = pads[i];
  }
  if (!pad) return;
  const buttons = pad.buttons || [];
  const pressed = (index) => Boolean(buttons[index] && buttons[index].pressed);
  for (const index of [12, 13, 14, 15, 0, 1]) {
    const action = padAction(index);
    if (!action || !edge(previous, action, pressed(index))) continue;
    if (action === "activate") {
      if (canActivate(document.activeElement)) document.activeElement.click();
    } else if (action === "back") goBack();
    else focusMove(action);
  }
  const axes = pad.axes || [];
  const x = axes.length > 0 ? axes[0] : 0;
  const y = axes.length > 1 ? axes[1] : 0;
  if (edge(previous, "sx", x > 0.6)) focusMove("right");
  if (edge(previous, "sxneg", x < -0.6)) focusMove("left");
  if (edge(previous, "sy", y > 0.6)) focusMove("down");
  if (edge(previous, "syneg", y < -0.6)) focusMove("up");
}

export function watchGamepad(addEventListener, start) {
  addEventListener("gamepadconnected", () => start());
}

export function bindInput() {
  document.addEventListener("keydown", onKey);
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    const previous = Object.create(null);
    const tick = () => {
      gamepadTick(previous, navigator);
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };
  watchGamepad((name, fn) => window.addEventListener(name, fn), start);
}
