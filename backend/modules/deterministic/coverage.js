

export function findCoverageGaps(requirements, questions) {
  const covered = new Set();

  for (const q of questions) {
    for (const id of q.requirement_ids) {
      covered.add(id);
    }
  }

  return requirements
    .filter(req => !covered.has(req.id))
    .map(req => req.id);
}