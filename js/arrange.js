// Placement and closeness. Pass/fail stays in score.js.
// Defaults, pending Alex:
// - Free placement. Stored in tenths of a scene unit (viewBox 200 by 120). No drawn grid.
// - Scale is a percent of 1. Rest is 70, which is the old 0.7 glyph scale. Limits are 40 and 180.
// - Turn is integer degrees. Plus and minus each step 15. Scale plus and minus each step 10.
// - Layer is an integer. Rest is 0. Plus and minus each step 1, and stop at -30 and 30.
//   A higher layer paints later, so it sits above a lower one. Equal layers keep tray order.
// - Closeness is 0 through 100 when puzzle.arrange names poses. It does not change Clear or Miss.
// - Weights: objects 40, position 20, scale 20, turn 20.
// - Position falls off by 80 scene units, scale by 60 points, turn by 45 degrees.
// - Bands: 100 exact, 80 close, 50 near, below that far.

export const SCENE_W = 2000;
export const SCENE_H = 1200;
export const SCALE_MIN = 40;
export const SCALE_MAX = 180;
export const SCALE_STEP = 10;
export const TURN_STEP = 15;
export const LAYER_MIN = -30;
export const LAYER_MAX = 30;
export const LAYER_STEP = 1;
export const REST_LAYER = 0;
export const REST_SCALE = 70;
export const PLACE_ZERO = 800;
export const SCALE_ZERO = 60;
export const TURN_ZERO = 45;

const WEIGHT_OBJECTS = 40;
const WEIGHT_PLACE = 20;
const WEIGHT_SCALE = 20;
const WEIGHT_TURN = 20;

function clampInt(value, min, max, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  let v = Math.round(value);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function normTurn(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  let v = Math.round(value) % 360;
  if (v < 0) v += 360;
  return v;
}

export function clampPose(pose) {
  const src = pose || {};
  return {
    x: clampInt(src.x, 0, SCENE_W, 0),
    y: clampInt(src.y, 0, SCENE_H, 0),
    s: clampInt(src.s, SCALE_MIN, SCALE_MAX, REST_SCALE),
    r: normTurn(src.r),
    z: clampInt(src.z, LAYER_MIN, LAYER_MAX, REST_LAYER),
  };
}

export function cleanPose(pose) {
  if (!pose || typeof pose !== "object" || Array.isArray(pose)) return null;
  if (!Number.isInteger(pose.x) || pose.x < 0 || pose.x > SCENE_W) return null;
  if (!Number.isInteger(pose.y) || pose.y < 0 || pose.y > SCENE_H) return null;
  if (!Number.isInteger(pose.s) || pose.s < SCALE_MIN || pose.s > SCALE_MAX) return null;
  if (!Number.isInteger(pose.r) || pose.r < 0 || pose.r > 359) return null;
  let z = REST_LAYER;
  if (pose.z != null) {
    if (!Number.isInteger(pose.z) || pose.z < LAYER_MIN || pose.z > LAYER_MAX) return null;
    z = pose.z;
  }
  return { x: pose.x, y: pose.y, s: pose.s, r: pose.r, z };
}

export function restPose(place) {
  return { x: place[0] * 10 + 112, y: place[1] * 10 + 112, s: REST_SCALE, r: 0, z: REST_LAYER };
}

export function samePose(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.s === b.s && a.r === b.r && a.z === b.z;
}

function tenth(n) {
  const sign = n < 0 ? "-" : "";
  let v = n < 0 ? -n : n;
  const whole = (v / 10) | 0;
  const frac = v % 10;
  if (frac === 0) return sign + String(whole);
  return sign + String(whole) + "." + String(frac);
}

function scaleText(s) {
  const whole = (s / 100) | 0;
  const frac = s % 100;
  if (frac === 0) return String(whole);
  const tens = (frac / 10) | 0;
  const ones = frac % 10;
  if (ones === 0) return String(whole) + "." + String(tens);
  return String(whole) + "." + String(tens) + String(ones);
}

export function poseTransform(pose) {
  const at = clampPose(pose);
  return (
    "translate(" +
    tenth(at.x) +
    " " +
    tenth(at.y) +
    ") rotate(" +
    String(at.r) +
    ") scale(" +
    scaleText(at.s) +
    ") translate(-16 -16)"
  );
}

export function panPose(origin, dx, dy) {
  return clampPose({ x: origin.x + dx, y: origin.y + dy, s: origin.s, r: origin.r, z: origin.z });
}

export function scalePose(origin, startDist, dist) {
  if (!(startDist > 0) || !(dist > 0)) return clampPose(origin);
  return clampPose({
    x: origin.x,
    y: origin.y,
    s: (origin.s * dist) / startDist,
    r: origin.r,
    z: origin.z,
  });
}

export function turnPose(origin, startAngle, angle) {
  return clampPose({
    x: origin.x,
    y: origin.y,
    s: origin.s,
    r: origin.r + (angle - startAngle),
    z: origin.z,
  });
}

export function bumpScale(pose, dir) {
  const step = dir < 0 ? -SCALE_STEP : SCALE_STEP;
  return clampPose({ x: pose.x, y: pose.y, s: pose.s + step, r: pose.r, z: pose.z });
}

export function bumpTurn(pose, dir) {
  const step = dir < 0 ? -TURN_STEP : TURN_STEP;
  return clampPose({ x: pose.x, y: pose.y, s: pose.s, r: pose.r + step, z: pose.z });
}

export function bumpLayer(pose, dir) {
  const step = dir < 0 ? -LAYER_STEP : LAYER_STEP;
  const base = pose && Number.isInteger(pose.z) ? pose.z : REST_LAYER;
  return clampPose({ x: pose.x, y: pose.y, s: pose.s, r: pose.r, z: base + step });
}

export function span(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function degrees(cx, cy, px, py) {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
}

function hasId(list, id) {
  if (!list) return false;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === id) return true;
  }
  return false;
}

function falloff(delta, zero) {
  if (delta <= 0) return 1000;
  if (delta >= zero) return 0;
  return 1000 - Math.round((delta * 1000) / zero);
}

export function nearBand(value) {
  if (value >= 100) return "exact";
  if (value >= 80) return "close";
  if (value >= 50) return "near";
  return "far";
}

export function closeness(build, poses, expected, trayIds, places) {
  if (expected == null || typeof expected !== "object" || Array.isArray(expected)) return null;
  if (!Array.isArray(trayIds) || !places) return null;
  const ids = [];
  const keys = Object.keys(expected);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i];
    if (!hasId(trayIds, id) || !places[id]) continue;
    if (!cleanPose(expected[id])) continue;
    ids.push(id);
  }
  if (ids.length === 0) return null;
  let matched = 0;
  let placeSum = 0;
  let scaleSum = 0;
  let turnSum = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (!hasId(build, id)) continue;
    matched += 1;
    const want = cleanPose(expected[id]);
    const stored = poses && Object.hasOwn(poses, id) ? cleanPose(poses[id]) : null;
    const have = stored || restPose(places[id]);
    const dx = have.x - want.x;
    const dy = have.y - want.y;
    placeSum += falloff(Math.round(Math.sqrt(dx * dx + dy * dy)), PLACE_ZERO);
    scaleSum += falloff(Math.abs(have.s - want.s), SCALE_ZERO);
    let turn = Math.abs(have.r - want.r) % 360;
    if (turn > 180) turn = 360 - turn;
    turnSum += falloff(turn, TURN_ZERO);
  }
  const n = ids.length;
  const value =
    Math.round((matched / n) * WEIGHT_OBJECTS) +
    Math.round((placeSum / n) * WEIGHT_PLACE / 1000) +
    Math.round((scaleSum / n) * WEIGHT_SCALE / 1000) +
    Math.round((turnSum / n) * WEIGHT_TURN / 1000);
  const capped = value > 100 ? 100 : value;
  return { value: capped, band: nearBand(capped) };
}
