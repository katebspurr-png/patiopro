const STORAGE_KEY = "patio_favorites";

export function getLocalFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setLocalFavorites(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function addLocalFavorite(patioId: string) {
  const ids = getLocalFavorites();
  if (!ids.includes(patioId)) {
    setLocalFavorites([...ids, patioId]);
  }
}

export function removeLocalFavorite(patioId: string) {
  setLocalFavorites(getLocalFavorites().filter((id) => id !== patioId));
}

export function isLocalFavorite(patioId: string): boolean {
  return getLocalFavorites().includes(patioId);
}
