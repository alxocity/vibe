export function flattenTray(tray) {
  const ids = [];
  const labels = Object.create(null);
  for (let g = 0; g < tray.groups.length; g += 1) {
    const blocks = tray.groups[g].blocks;
    for (let i = 0; i < blocks.length; i += 1) {
      ids.push(blocks[i].id);
      labels[blocks[i].id] = blocks[i].label;
    }
  }
  return { ids, labels };
}
