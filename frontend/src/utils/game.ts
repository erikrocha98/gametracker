export function formatPlatforms(platforms: string[]): string {
  return platforms.join(', ')
}

export function formatYear(releaseYear: number | null): string {
  return releaseYear != null ? String(releaseYear) : '—'
}
