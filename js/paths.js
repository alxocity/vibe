export function pad2(id) {
  const text = String(id);
  return text.length >= 2 ? text : "0" + text;
}

export function soloPath(id) {
  return "/solo/" + pad2(id) + "/";
}

export function echoPath(id) {
  return "/echo/" + pad2(id) + "/";
}

export function pageAddress(loc) {
  const origin = loc && loc.origin ? loc.origin : "";
  const path = loc && loc.pathname ? loc.pathname : "/";
  return origin + path;
}

export function nextIndex(current, delta, length) {
  if (length <= 0) return -1;
  if (current < 0) return delta > 0 ? 0 : length - 1;
  const next = current + delta;
  if (next < 0) return 0;
  if (next >= length) return length - 1;
  return next;
}

export function gridIndex(index, length, columns, direction) {
  if (length <= 0) return -1;
  const cols = columns > 1 ? columns : 1;
  let delta = 0;
  if (direction === "left") delta = -1;
  else if (direction === "right") delta = 1;
  else if (direction === "up") delta = -cols;
  else if (direction === "down") delta = cols;
  else return -1;
  if (index < 0) return delta > 0 ? 0 : length - 1;
  const next = index + delta;
  if (next < 0 || next >= length) return -1;
  return next;
}

export function columnIndex(index, columns) {
  const cols = columns > 1 ? columns : 1;
  const col = index % cols;
  return col < 0 ? 0 : col;
}

export function sameColumn(length, columns, column, edge) {
  const cols = columns > 1 ? columns : 1;
  if (length <= 0) return -1;
  let col = column;
  if (col < 0) col = 0;
  if (col >= cols) col = cols - 1;
  if (edge === "start") return col < length ? col : length - 1;
  const remainder = length % cols;
  const row = length - (remainder === 0 ? cols : remainder);
  const at = row + col;
  return at < length ? at : length - 1;
}
