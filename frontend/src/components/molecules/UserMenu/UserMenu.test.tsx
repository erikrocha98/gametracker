import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { UserMenu } from './UserMenu'
import { texts } from '../../../constants/texts'

function renderMenu(username = 'erik') {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <UserMenu username={username} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('renders username in trigger button', () => {
  renderMenu('erik')
  expect(screen.getByText('erik')).toBeInTheDocument()
})

test('menu is closed by default', () => {
  renderMenu()
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('opens menu when trigger is clicked', async () => {
  renderMenu()
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('renders all menu items when open', async () => {
  renderMenu()
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByText(texts.header.userMenu.profile)).toBeInTheDocument()
  expect(screen.getByText(texts.header.userMenu.myLists)).toBeInTheDocument()
  expect(screen.getByText(texts.header.userMenu.myGames)).toBeInTheDocument()
  expect(screen.getByText(texts.header.userMenu.reviews)).toBeInTheDocument()
})

test('closes menu when clicking outside', async () => {
  renderMenu()
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('menu')).toBeInTheDocument()
  await userEvent.click(document.body)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
