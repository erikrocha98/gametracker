export function formatPlatforms(platforms: string[]): string {
  return platforms.join(', ')
}

export function formatYear(releaseYear: number | null): string {
  return releaseYear != null ? String(releaseYear) : '—'
}

export function formatReleaseDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function formatRating(value: number | null): string {
  if (value == null) return '—'
  return value.toFixed(1)
}
