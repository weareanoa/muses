const BASE = import.meta.env.BASE_URL;

/**
 * Prefix a root-absolute path with Astro's configured base.
 * Neutral when base is "/", so the same code works for root and subpath deploys.
 */
export function withBase(path: string): string {
  if (!path || typeof path !== 'string') return path;
  // Only rewrite root-relative paths like "/images/..." or "/store"
  if (!path.startsWith('/') || path.startsWith('//')) {
    return path;
  }
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  if (!base) return path;
  if (path === '/') return `${base}/`;
  if (path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

/**
 * Recursively rewrite strings that start with "/" in data JSON.
 */
export function withBaseDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return withBase(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => withBaseDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'id' || key === 'sku') {
        out[key] = val;
      } else {
        out[key] = withBaseDeep(val);
      }
    }
    return out as unknown as T;
  }
  return value;
}
