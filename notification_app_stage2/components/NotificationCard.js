'use client'

import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'

export default function NotificationCard({ item, viewed, onClick, compact = false }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: viewed ? 'divider' : 'rgba(15,118,110,0.24)',
        bgcolor: viewed ? 'background.paper' : 'rgba(236, 253, 245, 0.75)',
      }}
    >
      <CardActionArea onClick={onClick} sx={{ alignItems: 'stretch' }}>
        <CardContent sx={{ p: compact ? 2 : 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack spacing={1} sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={item.type}
                  size="small"
                  color={item.type === 'Placement' ? 'success' : item.type === 'Result' ? 'primary' : 'default'}
                />
                <Chip label={viewed ? 'Viewed' : 'New'} size="small" variant={viewed ? 'outlined' : 'filled'} />
              </Stack>
              <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                {item.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.timestamp}
              </Typography>
            </Stack>
            <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Score
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {item.score}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
