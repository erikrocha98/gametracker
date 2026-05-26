import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import { IconButton } from '@mui/material'
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

const Actions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
`

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
`

const SearchInputContainer = styled.div<{ $open: boolean }>`
  width: ${({ $open }) => ($open ? '220px' : '0px')};
  overflow: hidden;
  transition: width 0.25s ease;
`

const SearchInput = styled.input`
  width: 220px;
  padding: 7px 12px;
  background-color: ${colors.inputBackground};
  border: 1px solid ${colors.inputBorder};
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 0.875rem;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: ${colors.textSecondary};
  }

  &:focus {
    border-color: ${colors.primary};
  }
`

export function Header() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const { status, results } = useGameSearch(debouncedQuery)

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setDropdownOpen(false)
    setQuery('')
  }, [])

  const toggleSearch = useCallback(() => {
    if (searchOpen) {
      closeSearch()
    } else {
      setSearchOpen(true)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen, closeSearch])

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    setDropdownOpen(value.trim().length > 0)
  }, [])

  const handleFocus = useCallback(() => {
    if (query.trim()) setDropdownOpen(true)
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') closeSearch()
  }, [closeSearch])

  const handleSelect = useCallback(() => {
    closeSearch()
  }, [closeSearch])

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
        closeSearch()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeSearch])

  return (
    <Wrapper>
      <Inner>
        <Logo size="sm" />
        <Nav>
          <NavLink to="/">{texts.header.navCatalog}</NavLink>
          <NavLink to="/profile">{texts.header.navProfile}</NavLink>
          <SearchWrapper ref={wrapperRef}>
            <IconButton
              onClick={toggleSearch}
              aria-label={texts.header.searchToggleAriaLabel}
              size="small"
              sx={{ color: searchOpen ? colors.primary : colors.textSecondary }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
            <SearchInputContainer $open={searchOpen}>
              <SearchInput
                ref={inputRef}
                value={query}
                placeholder={texts.header.searchPlaceholder}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
              />
            </SearchInputContainer>
            {dropdownOpen && (
              <SearchDropdown
                status={status}
                results={results}
                onSelect={handleSelect}
                onRetry={handleRetry}
              />
            )}
          </SearchWrapper>
        </Nav>
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
