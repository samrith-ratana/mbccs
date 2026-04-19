const counters = new Map<string, number>();

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

function getPeriod() {
  const now = new Date();
  const month = pad(now.getMonth() + 1, 2);
  const year = String(now.getFullYear()).slice(-2);
  return { month, year };
}

function parseSequence(id: string, prefix: string, month: string, year: string) {
  const pattern = new RegExp(`^${prefix}-${month}-${year}-(\\d{4})$`);
  const match = id.match(pattern);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function createId(prefix: string, existingIds?: string[]) {
  const { month, year } = getPeriod();
  const key = `${prefix}-${month}-${year}`;

  if (existingIds && existingIds.length > 0) {
    let max = 0;
    for (const id of existingIds) {
      const seq = parseSequence(id, prefix, month, year);
      if (seq && seq > max) max = seq;
    }
    const next = max + 1;
    return `${prefix}-${month}-${year}-${pad(next, 4)}`;
  }

  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return `${prefix}-${month}-${year}-${pad(next, 4)}`;
}
