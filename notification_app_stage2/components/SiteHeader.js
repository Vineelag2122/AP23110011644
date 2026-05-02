import Link from 'next/link'
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material'

export default function SiteHeader() {
  return (
    <AppBar position="sticky" elevation={0} color="transparent" sx={{ borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(12px)' }}>
      <Toolbar disableGutters>
        <Container maxWidth="xl" sx={{ py: 1.25 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
                Campus Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stage 2 React + MUI frontend
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button component={Link} href="/" variant="outlined" color="primary">
                All notifications
              </Button>
              <Button component={Link} href="/priority" variant="contained" color="primary">
                Priority inbox
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
