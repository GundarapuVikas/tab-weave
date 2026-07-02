export function wouldCreateCycle(
  adjacency: Map<string, Set<string>>,
  parentId: string,
  childId: string,
): boolean {
  if (parentId === childId) {
    return true;
  }

  const stack = [childId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    if (current === parentId) {
      return true;
    }

    visited.add(current);

    const children = adjacency.get(current);

    if (!children) {
      continue;
    }

    for (const next of children) {
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }

  return false;
}