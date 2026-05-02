'use client'

import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import { TYPE_WEIGHTS } from '../lib/notifications'

export default function NotificationDialog({ notification, open, onClose, onMarkViewed }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Chip label={notification?.type ?? 'Notification'} color="primary" size="small" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {notification?.message ?? 'Notification details'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {notification ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                ID
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {notification.id}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Type weight
              </Typography>
              <Typography variant="body2">{TYPE_WEIGHTS[notification.type] ?? 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Priority score
              </Typography>
              <Typography variant="body2">{notification.score}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Timestamp
              </Typography>
              <Typography variant="body2">{notification.timestamp}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Message
              </Typography>
              <Typography variant="body1">{notification.message}</Typography>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button onClick={onMarkViewed} variant="contained">
          Mark as viewed
        </Button>
      </DialogActions>
    </Dialog>
  )
}
