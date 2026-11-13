export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildDateRangeFilter(
  startDate?: string,
  endDate?: string
): Record<string, Date> | undefined {
  if (!startDate && !endDate) {
    return undefined;
  }

  const range: Record<string, Date> = {};

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      range.$gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

