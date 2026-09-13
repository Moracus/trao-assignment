export type GeneratedSectionItem = {
  generated?: boolean;
  edited?: boolean;
  pinned?: boolean;
  deleted?: boolean;
  id?: string;
};

export const mergeGeneratedSection = <T extends GeneratedSectionItem>(
  existing: T[] = [],
  regenerated: T[] = [],
) => {
  const seen = new Set<string>();
  const result: T[] = [];
  const regeneratedById = new Map<string, T>();

  for (const item of regenerated ?? []) {
    if (!item || item.deleted || !item.id) continue;
    regeneratedById.set(item.id, item);
  }

  for (const item of existing ?? []) {
    if (!item || item.deleted) continue;

    const id = item.id;
    const isSticky = !!item.edited || !!item.pinned || item.generated === false;

    if (isSticky) {
      if (id) seen.add(id);
      result.push(item);
      continue;
    }

    if (id && regeneratedById.has(id)) {
      const replacement = regeneratedById.get(id)!;
      result.push(replacement);
      seen.add(id);
    }
  }

  for (const item of regenerated ?? []) {
    if (!item || item.deleted || !item.id || seen.has(item.id)) continue;
    result.push(item);
    seen.add(item.id);
  }

  return result.filter((item) => !item.deleted);
};
