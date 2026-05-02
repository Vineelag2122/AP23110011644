'use client'

const STORAGE_KEY = 'stage2-viewed-notifications'

export function loadViewedIds() {
  if (typeof window === 'undefined') return new Set()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function saveViewedIds(ids) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore storage failures
  }
}
