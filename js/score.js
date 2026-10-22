// Pure rule. A build is a set of block ids. No clock, storage, locale, float, or random source.
// Any count of distinct tray ids is scored, including none. A duplicate or an unknown id is not a build.

const ROOM = {
  one: "One seat passed.",
  tie: "It is a tie.",
  neither: "Neither seat passed.",
  closed: "The match is over, and it says nothing about anyone.",
};

function divFloor(a, b) {
  const q = a / b;
  const r = a % b;
  if (r !== 0n && a < 0n) return q - 1n;
  return q;
}

function requireInt(value, name) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new TypeError(name);
  }
  return BigInt(value);
}

export function utcDayNumber(y, m, d) {
  let yy = requireInt(y, "year");
  const mm = requireInt(m, "month");
  const dd = requireInt(d, "day");
  if (mm <= 2n) yy -= 1n;
  const era = divFloor(yy >= 0n ? yy : yy - 399n, 400n);
  const yoe = yy - era * 400n;
  const moy = mm > 2n ? mm - 3n : mm + 9n;
  const doy = divFloor(153n * moy + 2n, 5n) + dd - 1n;
  const doe = yoe * 365n + divFloor(yoe, 4n) - divFloor(yoe, 100n) + doy;
  return era * 146097n + doe - 719468n;
}

export function echoId(today, launch) {
  return utcDayNumber(today.y, today.m, today.d) - utcDayNumber(launch.y, launch.m, launch.d);
}

function asList(build) {
  if (build == null || typeof build === "string") return null;
  if (typeof build[Symbol.iterator] !== "function") return null;
  const list = [];
  for (const id of build) list.push(id);
  return list;
}

function has(list, id) {
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === id) return true;
  }
  return false;
}

function rubricArrays(rubric) {
  if (
    !rubric ||
    !Array.isArray(rubric.required) ||
    !Array.isArray(rubric.anyOf) ||
    !Array.isArray(rubric.forbidden)
  ) {
    throw new TypeError("rubric");
  }
  return rubric;
}

export function score(build, rubric, trayIds) {
  rubricArrays(rubric);
  if (!Array.isArray(trayIds)) throw new TypeError("tray");
  const list = asList(build);
  if (!list) return { status: "not-a-build" };

  for (let i = 0; i < list.length; i += 1) {
    const id = list[i];
    if (typeof id !== "string" || !has(trayIds, id)) return { status: "not-a-build" };
    for (let j = 0; j < i; j += 1) {
      if (list[j] === id) return { status: "not-a-build" };
    }
  }

  for (let i = 0; i < rubric.required.length; i += 1) {
    if (!has(list, rubric.required[i])) return { status: "not-yet" };
  }
  if (rubric.anyOf.length > 0) {
    let hit = false;
    for (let i = 0; i < rubric.anyOf.length; i += 1) {
      if (has(list, rubric.anyOf[i])) {
        hit = true;
        break;
      }
    }
    if (!hit) return { status: "not-yet" };
  }
  for (let i = 0; i < rubric.forbidden.length; i += 1) {
    if (has(list, rubric.forbidden[i])) return { status: "not-yet" };
  }
  return { status: "pass" };
}

export function roomLine(input) {
  if (!input || typeof input !== "object") return null;
  if (input.left === true) return ROOM.closed;
  if (input.submittedA !== true || input.submittedB !== true) return null;
  const a = input.passA === true;
  const b = input.passB === true;
  if (a !== b) return ROOM.one;
  if (a && b) return ROOM.tie;
  return ROOM.neither;
}

export { ROOM };
