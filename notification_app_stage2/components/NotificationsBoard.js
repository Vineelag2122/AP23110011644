'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TYPE_OPTIONS, fetchAllNotifications, fetchNotificationsPage, topNotifications } from '../lib/notifications'
import { loadViewedIds, saveViewedIds } from '../lib/viewed'
import NotificationCard from './NotificationCard'
import NotificationDialog from './NotificationDialog'

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25]
const TOP_N_OPTIONS = [5, 10, 15, 20]

function SectionHeader({ title, subtitle }) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
  )
}

export default function NotificationsBoard({ mode = 'all' }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isPriority = mode === 'priority'

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState('All')
  const [topN, setTopN] = useState(10)
  const [unreadOnly, setUnreadOnly] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [viewedIds, setViewedIds] = useState(() => loadViewedIds())
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    saveViewedIds(viewedIds)
  }, [viewedIds])

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        if (isPriority) {
          const data = await fetchAllNotifications({
            pageSize: 100,
            type: typeFilter,
            maxPages: 50,
          })
          const ranked = topNotifications(data, Number(topN) || 10, {
            type: typeFilter,
            unreadOnly,
            viewedIds,
          })
          if (active) setItems(ranked)
        } else {
          const { notifications } = await fetchNotificationsPage({
            page,
            limit: pageSize,
            type: typeFilter,
          })
          if (active) setItems(notifications)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [isPriority, page, pageSize, topN, typeFilter, unreadOnly, viewedIds])

  const stats = useMemo(() => {
    const viewed = items.filter((item) => viewedIds.has(item.id)).length
    return {
      total: items.length,
      viewed,
      unread: items.length - viewed,
    }
  }, [items, viewedIds])

  function openNotification(item) {
    setSelectedNotification(item)
  }

  function closeDialog() {
    setSelectedNotification(null)
  }

  function markSelectedAsViewed() {
    if (!selectedNotification) return

    setViewedIds((current) => {
      const next = new Set(current)
      next.add(selectedNotification.id)
      return next
    })
    setSelectedNotification(null)
  }

  const content = isPriority ? (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={8}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader
            title="Priority notifications"
            subtitle="Top unread notifications are ranked by weight first and recency second."
          />
          <Stack spacing={2}>
            {items.length === 0 ? (
              <Alert severity="info">No priority notifications found for the selected filters.</Alert>
            ) : (
              items.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  viewed={viewedIds.has(item.id)}
                  onClick={() => openNotification(item)}
                  compact
                />
              ))
            )}
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 96 }}>
          <SectionHeader
            title="Priority controls"
            subtitle="Adjust top N and type filtering. Unread only keeps the inbox focused."
          />
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="priority-type-label">Notification type</InputLabel>
              <Select
                labelId="priority-type-label"
                label="Notification type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="topn-label">Top N</InputLabel>
              <Select labelId="topn-label" label="Top N" value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
                {TOP_N_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Typography variant="body2">Unread only</Typography>
              <Switch checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Displayed</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Viewed: {stats.viewed} / Unread: {stats.unread}</Typography>
              </Stack>
            </Paper>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  ) : (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={8}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader
            title="All notifications"
            subtitle="Browse the full feed with server-side paging, filtering, and viewed-state tracking."
          />
          <Stack spacing={2}>
            {items.length === 0 ? (
              <Alert severity="info">No notifications available for the selected page or filter.</Alert>
            ) : (
              items.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  viewed={viewedIds.has(item.id)}
                  onClick={() => openNotification(item)}
                />
              ))
            )}
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 96 }}>
          <SectionHeader
            title="Filter & paging"
            subtitle="Use API query params to page through the feed and narrow by notification type."
          />
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="all-type-label">Notification type</InputLabel>
              <Select
                labelId="all-type-label"
                label="Notification type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
              >
                {TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="pagesize-label">Page size</InputLabel>
              <Select labelId="pagesize-label" label="Page size" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Page"
              type="number"
              size="small"
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
              inputProps={{ min: 1 }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" fullWidth disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button variant="outlined" fullWidth onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Current page</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{page}</Typography>
                <Typography variant="body2" color="text.secondary">Loaded {stats.total} notifications on this page</Typography>
              </Stack>
            </Paper>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  )

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, rgba(15,118,110,0.08), rgba(29,78,216,0.05))' }}>
          <Stack spacing={1.25}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 800 }}>
              Campus Notifications Microservice
            </Typography>
            <Typography variant="h4">{isPriority ? 'Priority Inbox' : 'All Notifications'}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 860 }}>
              {isPriority
                ? 'The priority page ranks notifications by business weight and recency while keeping only the top N unread items visible.'
                : 'The all notifications page provides server-paged browsing with filters and clear viewed/new status indicators.'}
            </Typography>
          </Stack>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Total: ${stats.total}`} color="primary" variant="outlined" />
            <Chip label={`Viewed: ${stats.viewed}`} variant="outlined" />
            <Chip label={`Unread: ${stats.unread}`} color="success" variant="outlined" />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={isMobile ? 'Mobile layout' : 'Desktop layout'} color="secondary" variant="outlined" />
            <Chip label={isPriority ? 'Priority page' : 'All page'} variant="outlined" />
          </Stack>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? <Alert severity="info">Loading notifications...</Alert> : null}

        {content}

        <NotificationDialog
          notification={selectedNotification}
          open={Boolean(selectedNotification)}
          onClose={closeDialog}
          onMarkViewed={markSelectedAsViewed}
        />
      </Stack>
    </Container>
  )
}
