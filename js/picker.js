// Picker state. No clock, storage, locale, or random source.

function has(list, id) {
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === id) return true;
  }
  return false;
}

export function toggleId(picked, id) {
  const next = [];
  let found = false;
  for (let i = 0; i < picked.length; i += 1) {
    if (picked[i] === id) found = true;
    else next.push(picked[i]);
  }
  if (!found) next.push(id);
  return next;
}

export function blocksFor(groups, tabId) {
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].id === tabId) return groups[i].blocks;
  }
  if (!groups || groups.length === 0) return [];
  return groups[0].blocks;
}

export function tabByDelta(groups, tabId, delta) {
  if (!groups || groups.length === 0) return null;
  let index = 0;
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].id === tabId) index = i;
  }
  let next = index + delta;
  while (next < 0) next += groups.length;
  while (next >= groups.length) next -= groups.length;
  return groups[next].id;
}

export function checkMarks(picked, rubric) {
  const required = rubric && Array.isArray(rubric.required) ? rubric.required : [];
  const anyOf = rubric && Array.isArray(rubric.anyOf) ? rubric.anyOf : [];
  const forbidden = rubric && Array.isArray(rubric.forbidden) ? rubric.forbidden : [];
  const correct = [];
  const wrong = [];
  const missed = [];
  for (let i = 0; i < required.length; i += 1) {
    const id = required[i];
    if (has(forbidden, id)) continue;
    if (has(picked, id)) correct.push(id);
    else missed.push(id);
  }
  for (let i = 0; i < anyOf.length; i += 1) {
    const id = anyOf[i];
    if (has(forbidden, id) || has(required, id)) continue;
    if (has(picked, id)) correct.push(id);
  }
  for (let i = 0; i < picked.length; i += 1) {
    if (has(forbidden, picked[i])) wrong.push(picked[i]);
  }
  return { correct, wrong, missed };
}
