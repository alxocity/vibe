// Ghost outlines after a miss. One flag for practice and day 1.
// Set showGhosts to false to hide them everywhere.
// https://github.com/alxocity/ref-lab/issues/21
export const showGhosts = true;

export function ghostIds(missed, flag) {
  if (flag === false) return [];
  if (!missed || missed.length === 0) return [];
  return missed;
}
