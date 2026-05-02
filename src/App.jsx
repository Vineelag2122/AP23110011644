import { useEffect, useMemo, useState } from 'react'
import logging from './logging/middleware'
import './App.css'

const NOTIFICATION_URL = 'http://20.207.122.201/evaluation-service/notifications'
const DEFAULT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2aW5lZWxhX2d1amphcmxhcHVkaUBzcm1hcC5lZHUuaW4iLCJleHAiOjE3Nzc2OTg2NDQsImlhdCI6MTc3NzY5Nzc0NCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjU1NTA3MWZmLTlhNDMtNDAwMC1hNjVlLTdmNGY0ZGJkZGUxMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InZpbmVlbGEgZ3VqamFybGFwdWRpIiwic3ViIjoiNzU5YTQzMDEtZTM4MC00NGFiLWI2MmYtYzE0MDQxZmI4OGZmIn0sImVtYWlsIjoidmluZWVsYV9ndWpqYXJsYXB1ZGlAc3JtYXAuZWR1LmluIiwibmFtZSI6InZpbmVlbGEgZ3VqamFybGFwdWRpIiwicm9sbE5vIjoiYXAyMzExMDAxMTY0NCIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6Ijc1OWE0MzAxLWUzODAtNDRhYi1iNjJmLWMxNDA0MWZiODhmZiIsImNsaWVudFNlY3JldCI6IkNmY2dwTWFqdnR4WVRXUFYifQ.VXAPRr8C71jmJhIFJ_6P6kUADynLTKh9TdObLAj6yzs'
const STORAGE_KEY = 'campus-inbox-seen-ids'
const TYPE_LABELS = ['All', 'Placement', 'Result', 'Event']
const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
}

function readSeenIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function persistSeenIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore storage failures
  }
}

function parseTimestamp(value) {
  const parsed = Date.parse(String(value).replace(' ', 'T'))
  return Number.isNaN(parsed) ? 0 : parsed
}

function normalizeNotifications(payload) {
  const list = Array.isArray(payload?.notifications) ? payload.notifications : []
  return list.map((item) => ({
    id: item.ID,
    type: item.Type,
    message: item.Message,
    timestamp: item.Timestamp,
    timestampMs: parseTimestamp(item.Timestamp),
  }))
}

function scoreNotification(notification) {
  const weight = TYPE_WEIGHTS[notification.type] ?? 0
  return weight * 1_000_000_000_000 + notification.timestampMs
}

function pushToHeap(heap, item, limit) {
  heap.push(item)
  let index = heap.length - 1
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)
    if (heap[parent].score <= heap[index].score) break
    ;[heap[parent], heap[index]] = [heap[index], heap[parent]]
    index = parent
  }

  if (heap.length <= limit) return

  heap[0] = heap[heap.length - 1]
  heap.pop()
  let current = 0
  while (true) {
    let left = current * 2 + 1
    let right = current * 2 + 2
    let smallest = current

    if (left < heap.length && heap[left].score < heap[smallest].score) smallest = left
    if (right < heap.length && heap[right].score < heap[smallest].score) smallest = right
    if (smallest === current) break
    ;[heap[current], heap[smallest]] = [heap[smallest], heap[current]]
    current = smallest
  }
}

function topNotifications(notifications, limit, filterType, unreadOnly, seenIds) {
  const heap = []

  for (const notification of notifications) {
    const matchesType = filterType === 'All' || notification.type === filterType
    const isUnread = !seenIds.has(notification.id)
    if (!matchesType) continue
    if (unreadOnly && !isUnread) continue

    pushToHeap(
      heap,
      {
        notification,
        score: scoreNotification(notification),
      },
      limit,
    )
  }

  return heap
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry.notification, score: entry.score }))
}

function formatAgo(timestampMs) {
  const diff = Date.now() - timestampMs
  if (diff < 60_000) return `${Math.max(1, Math.round(diff / 1000))}s ago`
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}

function App() {
  const [token, setToken] = useState(DEFAULT_TOKEN)
  const [topCount, setTopCount] = useState(10)
  const [filterType, setFilterType] = useState('All')
  const [unreadOnly, setUnreadOnly] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allNotifications, setAllNotifications] = useState([])
  const [seenIds, setSeenIds] = useState(() => readSeenIds())
  const [logs, setLogs] = useState([])

  useEffect(() => {
    logging.initLogging({ endpoint: null, token: DEFAULT_TOKEN })
    const unsubscribe = logging.subscribe((buffer) => setLogs(buffer))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    persistSeenIds(seenIds)
  }, [seenIds])

  const derivedTop = useMemo(
    () => topNotifications(allNotifications, Number(topCount) || 10, filterType, unreadOnly, seenIds),
    [allNotifications, filterType, topCount, unreadOnly, seenIds],
  )

  const stats = useMemo(() => {
    const unread = allNotifications.filter((item) => !seenIds.has(item.id)).length
    const typeCounts = TYPE_LABELS.slice(1).map((label) => ({
      label,
      value: allNotifications.filter((item) => item.type === label).length,
    }))
    return { unread, total: allNotifications.length, typeCounts }
  }, [allNotifications, seenIds])

  async function loadNotifications() {
    if (!token.trim()) {
      setError('Add an auth token first.')
      return
    }

    setLoading(true)
    setError('')
    logging.setAuthToken(token.trim())

    try {
      const response = await logging.fetchWithLogging(NOTIFICATION_URL, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const payload = await response.json()
      const nextNotifications = normalizeNotifications(payload)
      setAllNotifications(nextNotifications)
      await logging.log('info', 'notifications-loaded', { count: nextNotifications.length })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      await logging.log('error', 'notifications-load-failed', { error: message })
    } finally {
      setLoading(false)
    }
  }

  function markVisibleAsSeen() {
    setSeenIds((current) => {
      const merged = new Set(current)
      for (const item of derivedTop) {
        merged.add(item.id)
      }
      return merged
    })
    logging.log('info', 'notifications-marked-seen', { count: derivedTop.length })
  }

  function resetViewState() {
    setAllNotifications([])
    setSeenIds(new Set())
    setError('')
    setFilterType('All')
    setTopCount(10)
    setUnreadOnly(true)
    logging.log('info', 'inbox-reset', {})
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Campus Notifications Microservice</span>
          <h1>Priority Inbox</h1>
          <p className="hero-text">
            Fetch the protected notifications feed, rank items by type and recency,
            and keep only the top unread entries that matter most.
          </p>

          <div className="controls-grid">
            <label className="control-group">
              <span>Auth token</span>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                rows={4}
                spellCheck="false"
              />
            </label>

            <div className="control-row">
              <label className="control-group compact">
                <span>Top n</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={topCount}
                  onChange={(e) => setTopCount(e.target.value)}
                />
              </label>

              <label className="control-group compact">
                <span>Type</span>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  {TYPE_LABELS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                />
                <span>Unread only</span>
              </label>
            </div>

            <div className="button-row">
              <button className="primary" type="button" onClick={loadNotifications} disabled={loading}>
                {loading ? 'Loading…' : 'Load notifications'}
              </button>
              <button className="secondary" type="button" onClick={markVisibleAsSeen}>
                Mark visible as seen
              </button>
              <button className="ghost" type="button" onClick={resetViewState}>
                Reset view
              </button>
            </div>

            {error ? <p className="error-banner">{error}</p> : null}
          </div>
        </div>

        <aside className="summary-panel">
          <div className="summary-card accent">
            <span>Top items</span>
            <strong>{derivedTop.length}</strong>
            <small>Displayed in the inbox</small>
          </div>
          <div className="summary-card">
            <span>Unread</span>
            <strong>{stats.unread}</strong>
            <small>Not yet marked seen</small>
          </div>
          <div className="summary-card">
            <span>Total loaded</span>
            <strong>{stats.total}</strong>
            <small>From the notifications API</small>
          </div>

          <div className="type-breakdown">
            {stats.typeCounts.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="inbox-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow muted">Priority Inbox</span>
            <h2>Top notifications</h2>
          </div>
          <p>
            Ranking uses type first, then recency, with a bounded min-heap so the app can
            keep the top <strong>n</strong> efficiently.
          </p>
        </div>

        <div className="inbox-list">
          {derivedTop.length === 0 ? (
            <div className="empty-state">
              <h3>No notifications to show</h3>
              <p>Load the feed or widen the filters to populate the priority inbox.</p>
            </div>
          ) : (
            derivedTop.map((item, index) => {
              const seen = seenIds.has(item.id)
              return (
                <article className={`notification-card ${seen ? 'seen' : ''}`} key={item.id}>
                  <div className="notification-rank">#{index + 1}</div>
                  <div className="notification-main">
                    <div className="notification-meta">
                      <span className={`pill ${item.type.toLowerCase()}`}>{item.type}</span>
                      <span className="timestamp">{formatAgo(item.timestampMs)}</span>
                      {seen ? <span className="pill muted-pill">Seen</span> : <span className="pill hot-pill">Unread</span>}
                    </div>
                    <h3>{item.message}</h3>
                    <p>{item.timestamp}</p>
                  </div>
                  <div className="notification-score">
                    <span>Score</span>
                    <strong>{item.score}</strong>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      <section className="log-panel">
        <div className="panel-header compact">
          <div>
            <span className="eyebrow muted">Logging middleware</span>
            <h2>Recent activity</h2>
          </div>
          <p>Structured logs generated by the middleware appear here for verification.</p>
        </div>

        <div className="log-list">
          {logs.slice(-8).reverse().map((entry) => (
            <article key={entry.id} className={`log-entry ${entry.level}`}>
              <div>
                <strong>{entry.message}</strong>
                <span>{entry.timestamp}</span>
              </div>
              <pre>{JSON.stringify(entry.meta, null, 2)}</pre>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App