import { IconButton } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { useAuth } from '../../../contexts/AuthContext'
import { useDebounce } from '../../../hooks/useDebounce'
import { useGameSearch } from '../../../hooks/useGameSearch'
import { Logo } from '../../atoms/Logo'
import { NavLink } from '../../atoms/NavLink'
import { SearchBar } from '../../molecules/SearchBar'
import { SearchDropdown } from '../SearchDropdown'

const Wrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: ${colors.headerBackground};
  border-bottom: 1px solid ${colors.headerBorder};
`

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 32px;
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;
`

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 360px;
`

const Actions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`

export function Header() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const { status, results } = useGameSearch(debouncedQuery)

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    setOpen(value.trim().length > 0)
  }, [])

  const handleFocus = useCallback(() => {
    if (query.trim()) setOpen(true)
  }, [query])

  const handleClear = useCallback(() => {
    setQuery('')
    setOpen(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  const handleSelect = useCallback(() => {
    setQuery('')
    setOpen(false)
  }, [])

  const handleRetry = useCallback(() => {
    const current = query
    setQuery('')
    setTimeout(() => setQuery(current), 0)
  }, [query])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login')
  }, [logout, navigate])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <Wrapper>
      <Inner>
        <Logo size="sm" />
        <Nav>
          <NavLink to="/">{texts.header.navCatalog}</NavLink>
          <NavLink to="/adicionar">{texts.header.navAdd}</NavLink>
          <NavLink to="/perfil">{texts.header.navProfile}</NavLink>
        </Nav>
        <SearchWrapper ref={wrapperRef}>
          <SearchBar
            value={query}
            onChange={handleChange}
            onClear={handleClear}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
          />
          {open && (
            <SearchDropdown
              status={status}
              results={results}
              onSelect={handleSelect}
              onRetry={handleRetry}
            />
          )}
        </SearchWrapper>
        <Actions>
          <IconButton
            onClick={handleLogout}
            aria-label={texts.header.logoutAriaLabel}
            size="small"
            sx={{ color: colors.textSecondary }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Actions>
      </Inner>
    </Wrapper>
  )
}
