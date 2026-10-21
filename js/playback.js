// Reads a result the rule already returned. Does not score.

export function checkLabel(ready) {
  return ready ? "Check" : "Check. Pick five blocks.";
}

export function playbackLine(status, worksLine, notYetLine) {
  if (status === "pass") return worksLine;
  if (status === "not-yet") return notYetLine;
  return null;
}
