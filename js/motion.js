// Short motions for a pick. The Web Animations API moves a flyer. Reduced motion stays put.

export const ACTION_MS = 280;

export function flightPlan(reduced, from, to) {
  if (reduced) return { kind: "instant" };
  if (!from || !to) return { kind: "instant" };
  if (!(from.width > 0) || !(to.width > 0) || !(from.height > 0) || !(to.height > 0)) return { kind: "instant" };
  return { kind: "fly", ms: ACTION_MS };
}

function px(value) {
  return String(Math.round(value)) + "px";
}

export function playFly(node, from, to, ms) {
  node.style.setProperty("left", px(from.left));
  node.style.setProperty("top", px(from.top));
  node.style.setProperty("width", px(from.width));
  node.style.setProperty("height", px(from.height));
  const midLeft = from.left + (to.left - from.left) * 0.5;
  const midTop = from.top + (to.top - from.top) * 0.5;
  const overLeft = to.left + (to.left - from.left) * 0.06;
  const overTop = to.top + (to.top - from.top) * 0.06;
  const midWidth = from.width * 0.82;
  const midHeight = from.height * 0.82;
  return node.animate(
    [
      { left: px(from.left), top: px(from.top), width: px(from.width), height: px(from.height) },
      { left: px(midLeft), top: px(midTop), width: px(midWidth), height: px(midHeight), offset: 0.45 },
      { left: px(overLeft), top: px(overTop), width: px(to.width), height: px(to.height), offset: 0.82 },
      { left: px(to.left), top: px(to.top), width: px(to.width), height: px(to.height) },
    ],
    { duration: ms, easing: "linear", fill: "forwards" },
  );
}
