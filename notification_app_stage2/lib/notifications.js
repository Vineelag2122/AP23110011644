export const NOTIFICATIONS_API_URL =
  'http://20.207.122.201/evaluation-service/notifications'

export const TYPE_OPTIONS = ['All', 'Placement', 'Result', 'Event']

export const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
}

function parseTimestamp(value) {
  const parsed = Date.parse(String(value).replace(' ', 'T'))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function normalizeNotification(item) {
  return {
    id: item.ID,
    type: item.Type,
    message: item.Message,
    timestamp: item.Timestamp,
    timestampMs: parseTimestamp(item.Timestamp),
  }
}

export function scoreNotification(notification) {
  const weight = TYPE_WEIGHTS[notification.type] ?? 0
  return weight * 1_000_000_000_000 + notification.timestampMs
}

function buildUrl({ page = 1, limit = 10, type = 'All' } = {}) {
  const url = new URL(NOTIFICATIONS_API_URL)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))

  if (type && type !== 'All') {
    url.searchParams.set('notification_type', type)
  }

  return url.toString()
}

export async function fetchNotificationsPage({ page = 1, limit = 10, type = 'All' } = {}) {
  const response = await fetch(buildUrl({ page, limit, type }), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Request failed with status ${response.status}${body ? `: ${body}` : ''}`)
  }

  const payload = await response.json()
  const notifications = Array.isArray(payload.notifications)
    ? payload.notifications
    : Array.isArray(payload.data)
      ? payload.data
      : []

  return {
    notifications: notifications.map(normalizeNotification),
    raw: payload,
  }
}

export async function fetchAllNotifications({ pageSize = 100, type = 'All', maxPages = 50 } = {}) {
  const collected = []

  for (let page = 1; page <= maxPages; page += 1) {
    const { notifications } = await fetchNotificationsPage({ page, limit: pageSize, type })
    collected.push(...notifications)

    if (notifications.length < pageSize) {
      break
    }
  }

  return collected
}

function pushHeap(heap, item) {
  heap.push(item)
  let index = heap.length - 1

  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)
    if (heap[parent].score <= heap[index].score) break
    ;[heap[parent], heap[index]] = [heap[index], heap[parent]]
    index = parent
  }
}

function bubbleDown(heap, index) {
  let current = index

  while (true) {
    const left = current * 2 + 1
    const right = current * 2 + 2
    let smallest = current

    if (left < heap.length && heap[left].score < heap[smallest].score) smallest = left
    if (right < heap.length && heap[right].score < heap[smallest].score) smallest = right
    if (smallest === current) break

    ;[heap[current], heap[smallest]] = [heap[smallest], heap[current]]
    current = smallest
  }
}

function popHeap(heap) {
  if (heap.length === 0) return null
  if (heap.length === 1) return heap.pop()

  const top = heap[0]
  heap[0] = heap.pop()
  bubbleDown(heap, 0)
  return top
}

export function topNotifications(notifications, topN, { type = 'All', unreadOnly = false, viewedIds = new Set() } = {}) {
  const heap = []

  for (const notification of notifications) {
    const matchesType = type === 'All' || notification.type === type
    const isUnread = !viewedIds.has(notification.id)

    if (!matchesType) continue
    if (unreadOnly && !isUnread) continue

    const candidate = { notification, score: scoreNotification(notification) }
    pushHeap(heap, candidate)

    if (heap.length > topN) {
      popHeap(heap)
    }
  }

  return heap.sort((a, b) => b.score - a.score).map((entry) => ({
    ...entry.notification,
    score: entry.score,
  }))
}
