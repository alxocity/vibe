// Picture templates for the tray and the live scene. No clock, no score.

import { poseTransform, restPose } from "./arrange.js";

function stroke(d) {
  return {
    tag: "path",
    attrs: {
      d,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "vector-effect": "non-scaling-stroke",
    },
  };
}

function fill(d) {
  return { tag: "path", attrs: { d, fill: "currentColor" } };
}

function ring(cx, cy, r) {
  return {
    tag: "circle",
    attrs: {
      cx,
      cy,
      r,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "vector-effect": "non-scaling-stroke",
    },
  };
}

function swatch(tag, attrs, name) {
  const next = { fill: "currentColor", "data-swatch": name };
  const keys = Object.keys(attrs);
  for (let i = 0; i < keys.length; i += 1) next[keys[i]] = attrs[keys[i]];
  next["data-swatch"] = name;
  return { tag, attrs: next };
}

export const GLYPHS = {
  pineapple: [
    stroke("M16 27 C10 27 9 20 9 16 C9 11 12 8 16 8 C20 8 23 11 23 16 C23 20 22 27 16 27 Z"),
    stroke("M13 9 L16 3 L19 9"),
    stroke("M12 14 H20"),
    stroke("M11 18 H21"),
    stroke("M12 22 H20"),
  ],
  pizza: [
    {
      tag: "path",
      attrs: {
        d: "M6 26 L16 6 L26 26 Z M14 16 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M19 19 m-1.5 0 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0",
        fill: "currentColor",
        "fill-rule": "evenodd",
      },
    },
  ],
  oven: [
    stroke("M7 8 H25 V26 H7 Z"),
    stroke("M10 11 H22 V18 H10 Z"),
    stroke("M14 22 H18"),
    stroke("M16 8 V5"),
  ],
  fridge: [
    stroke("M10 4 H22 V28 H10 Z"),
    stroke("M16 4 V28"),
    stroke("M16 12 H19"),
    stroke("M16 18 H19"),
  ],
  spoon: [
    stroke("M16 5 C12 5 10 9 10 13 C10 17 13 19 16 19 C19 19 22 17 22 13 C22 9 20 5 16 5 Z"),
    stroke("M16 19 V28"),
  ],
  red: [swatch("circle", { cx: "16", cy: "16", r: "10" }, "red")],
  circle: [ring("16", "16", "10")],
  extra: [stroke("M16 6 V26 M6 16 H26")],
  hot: [
    swatch("path", { d: "M16 27 C10 21 11 15 16 5 C21 15 22 21 16 27 Z" }, "gold"),
    stroke("M16 23 C14 19 18 17 16 13"),
  ],
  slice: [stroke("M8 26 L16 6 L24 26 Z")],
  lamp: [
    fill("M8 8 H24 L20 16 H12 Z"),
    stroke("M16 16 V25"),
    stroke("M11 26 H21"),
  ],
  desk: [
    stroke("M4 14 H28"),
    stroke("M7 14 V27"),
    stroke("M25 14 V27"),
    stroke("M4 18 H28"),
  ],
  chair: [
    stroke("M9 13 H23 V22 H9 Z"),
    stroke("M9 13 V6 H23"),
    stroke("M12 22 V28"),
    stroke("M20 22 V28"),
  ],
  mug: [
    stroke("M9 8 H20 V20 C20 25 9 25 9 20 Z"),
    stroke("M20 12 H24 C27 12 27 18 20 18"),
  ],
  window: [
    stroke("M6 6 H26 V26 H6 Z"),
    stroke("M16 6 V26"),
    stroke("M6 16 H26"),
  ],
  "sticky-note": [
    stroke("M7 6 H20 L26 12 V26 H7 Z"),
    stroke("M20 6 V12 H26"),
  ],
  blue: [swatch("rect", { x: "7", y: "7", width: "18", height: "18" }, "blue")],
  square: [stroke("M7 7 H25 V25 H7 Z")],
  busy: [stroke("M6 9 H26 M6 16 H20 M6 23 H26")],
  quiet: [
    ring("13", "16", "4"),
    stroke("M19 11 C23 13 23 19 19 21"),
  ],
  dragon: [
    stroke("M5 22 C9 14 14 18 18 12 C22 6 28 9 28 9"),
    stroke("M28 9 L24 12"),
    stroke("M18 14 L10 7 L16 16"),
    stroke("M10 22 L8 28"),
    stroke("M16 21 L16 28"),
  ],
  crown: [fill("M5 24 L8 10 L16 18 L24 10 L27 24 Z")],
  sword: [
    stroke("M16 3 V22"),
    stroke("M9 16 H23"),
    fill("M13 22 H19 V28 H13 Z"),
  ],
  castle: [
    stroke("M5 28 V16 H9 V8 H13 V16 H19 V8 H23 V16 H27 V28"),
    stroke("M13 28 V22 H19 V28"),
  ],
  potion: [
    stroke("M12 6 H20"),
    stroke("M14 6 V12 L10 22 C10 27 22 27 22 22 L18 12 V6"),
    ring("16", "20", "2"),
  ],
  shield: [fill("M16 4 L26 9 V16 C26 23 16 28 16 28 C16 28 6 23 6 16 V9 Z")],
  map: [
    stroke("M6 8 H26 V24 H6 Z"),
    stroke("M8 20 C12 12 16 20 24 12"),
  ],
  purple: [swatch("path", { d: "M16 4 L28 16 L16 28 L4 16 Z" }, "purple")],
  star: [fill("M16 3 L19 12 L28 12 L21 18 L24 27 L16 21 L8 27 L11 18 L4 12 L13 12 Z")],
  quest: [
    stroke("M8 28 V4"),
    fill("M8 5 H24 L19 10 L24 15 H8 Z"),
  ],
};

export const PLACE = {
  pineapple: [16, 76],
  pizza: [42, 76],
  oven: [8, 46],
  fridge: [36, 42],
  spoon: [68, 78],
  red: [6, 6],
  circle: [146, 76],
  extra: [120, 78],
  hot: [92, 6],
  slice: [94, 76],
  lamp: [66, 44],
  desk: [92, 56],
  chair: [118, 50],
  mug: [144, 72],
  window: [156, 8],
  "sticky-note": [122, 46],
  blue: [28, 6],
  square: [170, 76],
  busy: [6, 96],
  quiet: [168, 46],
  dragon: [58, 4],
  crown: [108, 4],
  sword: [174, 40],
  castle: [4, 20],
  potion: [140, 40],
  shield: [96, 42],
  map: [46, 68],
  purple: [50, 6],
  star: [128, 4],
  quest: [78, 26],
};

export function scenePlan(picked, trayIds) {
  const want = Object.create(null);
  for (let i = 0; i < picked.length; i += 1) want[picked[i]] = true;
  const order = [];
  for (let i = 0; i < trayIds.length; i += 1) {
    if (want[trayIds[i]]) order.push(trayIds[i]);
  }
  const sky = [];
  for (let i = 0; i < order.length; i += 1) {
    const id = order[i];
    if (id === "red" || id === "blue" || id === "purple") sky.push(id);
  }
  return { order, sky };
}

function skyShapes(bands) {
  if (bands.length === 0) {
    return [
      {
        tag: "rect",
        attrs: {
          x: "1",
          y: "1",
          width: "198",
          height: "70",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
        },
      },
    ];
  }
  const widths = bands.length === 1 ? ["198"] : bands.length === 2 ? ["99", "99"] : ["66", "66", "66"];
  const nodes = [];
  let x = 1;
  for (let i = 0; i < bands.length; i += 1) {
    nodes.push(swatch("rect", { x: String(x), y: "1", width: widths[i], height: "70" }, bands[i]));
    x += Number(widths[i]);
  }
  nodes.push({
    tag: "rect",
    attrs: { x: "1", y: "1", width: "198", height: "70", fill: "none", stroke: "currentColor", "stroke-width": "2" },
  });
  return nodes;
}

function ground(y, opacity) {
  return {
    tag: "rect",
    attrs: { x: "0", y: String(y), width: "200", height: String(120 - y), fill: "currentColor", opacity },
  };
}

function horizon(y, opacity) {
  const attrs = { x1: "1", y1: String(y), x2: "199", y2: String(y), stroke: "currentColor", "stroke-width": "2" };
  if (opacity) attrs.opacity = opacity;
  return { tag: "line", attrs };
}

function bar(x, y, width) {
  return {
    tag: "rect",
    attrs: { x: String(x), y: String(y), width: String(width), height: "6", fill: "currentColor", opacity: "0.12" },
  };
}

function ink(d) {
  const node = stroke(d);
  node.attrs.opacity = "0.12";
  return node;
}

function roomShapes() {
  return [
    { tag: "rect", attrs: { x: "0", y: "72", width: "200", height: "48", fill: "currentColor", opacity: "0.12" } },
    { tag: "line", attrs: { x1: "1", y1: "72", x2: "199", y2: "72", stroke: "currentColor", "stroke-width": "2" } },
    { tag: "rect", attrs: { x: "28", y: "98", width: "144", height: "6", fill: "currentColor" } },
    { tag: "line", attrs: { x1: "40", y1: "104", x2: "40", y2: "116", stroke: "currentColor", "stroke-width": "2" } },
    { tag: "line", attrs: { x1: "160", y1: "104", x2: "160", y2: "116", stroke: "currentColor", "stroke-width": "2" } },
  ];
}

function gardenShapes() {
  return [
    ground(78, "0.1"),
    horizon(78, "0.12"),
    ink("M16 116 C16 102 30 100 30 116"),
    ink("M24 116 C24 108 36 106 36 116"),
    ink("M158 116 C158 98 176 96 176 116"),
    ink("M168 116 C168 106 184 104 184 116"),
  ];
}

function gateShapes() {
  return [
    ground(96, "0.1"),
    horizon(96, "0.12"),
    ink("M150 116 V104"),
    ink("M186 116 V104"),
    ink("M150 104 Q168 100 186 104"),
  ];
}

function hallShapes() {
  return [
    ground(86, "0.1"),
    horizon(86, "0.12"),
    ink("M14 36 V86"),
    ink("M26 36 V86"),
    ink("M174 36 V86"),
    ink("M186 36 V86"),
  ];
}

function kitchenShapes() {
  return [
    ground(92, "0.08"),
    horizon(92, "0.12"),
    bar(24, 92, 152),
    ink("M32 116 V104 H46 V116"),
    ink("M170 116 V104 H184 V116"),
  ];
}

function pathShapes() {
  return [
    ground(72, "0.08"),
    horizon(72, "0.12"),
    ink("M68 118 L96 74"),
    ink("M132 118 L104 74"),
  ];
}

function riverShapes() {
  return [
    ground(84, "0.12"),
    horizon(84, "0.12"),
    ink("M1 96 C40 90 70 102 110 96 C150 90 170 102 199 96"),
    ink("M1 108 C50 102 80 114 120 108 C160 102 180 114 199 108"),
  ];
}

function shoreShapes() {
  return [
    { tag: "rect", attrs: { x: "0", y: "74", width: "200", height: "14", fill: "currentColor", opacity: "0.08" } },
    ground(88, "0.12"),
    horizon(88, "0.12"),
    { tag: "circle", attrs: { cx: "26", cy: "110", r: "3", fill: "currentColor" } },
    { tag: "circle", attrs: { cx: "170", cy: "106", r: "2", fill: "currentColor" } },
  ];
}

function officeShapes() {
  return [
    ground(84, "0.08"),
    horizon(84, "0.12"),
    bar(36, 100, 128),
  ];
}

const BACKDROPS = {
  room: roomShapes,
  garden: gardenShapes,
  gate: gateShapes,
  hall: hallShapes,
  kitchen: kitchenShapes,
  office: officeShapes,
  path: pathShapes,
  river: riverShapes,
  shore: shoreShapes,
};

export function backdropShapes(name) {
  if (!Object.hasOwn(BACKDROPS, name)) return roomShapes();
  return BACKDROPS[name]();
}

function themeName(name) {
  if (!Object.hasOwn(BACKDROPS, name)) return "room";
  return name;
}

export function glyphTree(id) {
  return {
    tag: "svg",
    attrs: { viewBox: "0 0 32 32", "aria-hidden": "true" },
    kids: GLYPHS[id],
  };
}

function placed(id, attrs, pose) {
  const place = PLACE[id];
  if (!place || !GLYPHS[id]) return null;
  const next = { transform: poseTransform(pose || restPose(place)) };
  const keys = Object.keys(attrs);
  for (let i = 0; i < keys.length; i += 1) next[keys[i]] = attrs[keys[i]];
  return {
    tag: "g",
    attrs: next,
    kids: [
      { tag: "rect", attrs: { x: "0", y: "0", width: "32", height: "32", fill: "transparent", "pointer-events": "all" } },
      { tag: "g", attrs: { "data-pose": id }, kids: GLYPHS[id] },
    ],
  };
}

function ambientDust() {
  return {
    tag: "g",
    attrs: { "data-ambient": "dust" },
    kids: [
      { tag: "circle", attrs: { cx: "36", cy: "24", r: "1.1", fill: "currentColor" } },
      { tag: "circle", attrs: { cx: "88", cy: "16", r: "0.8", fill: "currentColor" } },
      { tag: "circle", attrs: { cx: "146", cy: "28", r: "1.2", fill: "currentColor" } },
    ],
  };
}

function ambientTorch(transform) {
  return {
    tag: "g",
    attrs: { "data-ambient": "torch", transform: transform || "translate(4 28) scale(0.45)" },
    kids: [
      stroke("M16 28 C11 22 12 16 16 8 C20 16 21 22 16 28 Z"),
      stroke("M16 24 C14 20 18 18 16 14"),
    ],
  };
}

function ambientGlow(transform) {
  return {
    tag: "g",
    attrs: { "data-ambient": "glow", transform },
    kids: [
      ring("16", "16", "7"),
      { tag: "circle", attrs: { cx: "16", cy: "16", r: "2", fill: "currentColor" } },
    ],
  };
}

function ambientRipple(transform) {
  return {
    tag: "g",
    attrs: { "data-ambient": "ripple", transform },
    kids: [
      stroke("M4 16 C10 12 18 20 28 16"),
      stroke("M4 22 C12 18 18 26 28 22"),
    ],
  };
}

function specks(points) {
  const kids = [];
  for (let i = 0; i < points.length; i += 1) {
    kids.push({
      tag: "circle",
      attrs: { cx: String(points[i][0]), cy: String(points[i][1]), r: points[i][2], fill: "currentColor" },
    });
  }
  return { tag: "g", attrs: { "data-ambient": "dust" }, kids };
}

const AMBIENT = {
  room: () => ({ light: ambientTorch(), dust: ambientDust() }),
  garden: () => ({
    light: ambientGlow("translate(168 2) scale(0.5)"),
    dust: specks([[34, 18, "1.1"], [96, 12, "0.8"], [140, 22, "1"]]),
  }),
  gate: () => ({
    light: ambientTorch("translate(48 40) scale(0.4)"),
    dust: specks([[40, 24, "0.8"], [100, 16, "1"], [156, 28, "0.9"]]),
  }),
  hall: () => ({
    light: ambientTorch("translate(8 32) scale(0.4)"),
    dust: specks([[48, 22, "0.9"], [100, 14, "1.1"], [152, 24, "0.8"]]),
  }),
  kitchen: () => ({
    light: ambientTorch("translate(40 64) scale(0.4)"),
    dust: specks([[48, 70, "1"], [70, 62, "0.8"], [154, 66, "1"]]),
  }),
  office: () => ({
    light: ambientGlow("translate(150 78) scale(0.4)"),
    dust: specks([[30, 20, "0.8"], [88, 16, "1"], [132, 24, "0.9"]]),
  }),
  path: () => ({
    light: ambientGlow("translate(88 58) scale(0.35)"),
    dust: specks([[78, 96, "0.9"], [100, 84, "1"], [122, 100, "0.8"]]),
  }),
  river: () => ({
    light: ambientRipple("translate(148 90) scale(0.8)"),
    dust: specks([[36, 100, "1"], [96, 108, "0.8"], [124, 98, "1.1"]]),
  }),
  shore: () => ({
    light: ambientRipple("translate(16 96) scale(0.8)"),
    dust: specks([[48, 104, "0.9"], [110, 110, "1"], [150, 100, "0.8"]]),
  }),
};

export function sceneTree(plan) {
  const theme = themeName(plan.backdrop);
  const ambient = Object.hasOwn(AMBIENT, theme) ? AMBIENT[theme]() : AMBIENT.room();
  const layers = [
    { tag: "g", attrs: { "data-layer": "room", "data-theme": theme }, kids: backdropShapes(plan.backdrop) },
    ambient.light,
    { tag: "g", attrs: { "data-layer": "sky" }, kids: skyShapes(plan.sky) },
    ambient.dust,
  ];
  const seen = Object.create(null);
  for (let i = 0; i < plan.order.length; i += 1) {
    const id = plan.order[i];
    const pose = plan.poses && Object.hasOwn(plan.poses, id) ? plan.poses[id] : null;
    const layer = placed(id, { "data-layer": id }, pose);
    if (!layer) continue;
    seen[id] = true;
    layers.push(layer);
  }
  const ghosts = plan.ghosts || [];
  for (let i = 0; i < ghosts.length; i += 1) {
    const id = ghosts[i];
    if (seen[id]) continue;
    const layer = placed(id, { "data-ghost": id });
    if (layer) layers.push(layer);
  }
  return {
    tag: "svg",
    attrs: { viewBox: "0 0 200 120", "aria-hidden": "true" },
    kids: layers,
  };
}

export function shareGlyph() {
  return {
    tag: "svg",
    attrs: { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" },
    kids: [
      stroke("M14 4h6v6"),
      stroke("M20 4L9 15"),
      stroke("M10 4H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4"),
    ],
  };
}

export const DRAW_TAGS = ["svg", "g", "path", "circle", "rect", "line", "polygon"];

export function walkDraw(node, visit) {
  visit(node);
  const kids = node.kids || [];
  for (let i = 0; i < kids.length; i += 1) walkDraw(kids[i], visit);
}
