import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { Avatar } from '../../atoms/Avatar'

interface UserMenuProps {
  username: string
}

const Wrapper = styled.div`
  position: relative;
`

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.textSecondary};
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  padding: 4px 0;
  transition: color 0.15s;

  &:hover {
    color: ${colors.textPrimary};
  }
`

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
  border-radius: 8px;
  z-index: 100;
  overflow: hidden;
`

const MenuItem = styled(Link)`
  display: block;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  text-decoration: none;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${colors.cardHover};
    color: ${colors.textPrimary};
  }
`

export function UserMenu({ username }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [close])

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <Avatar username={username} size={28} />
        {username}
      </Trigger>
      {open && (
        <Panel role="menu">
          <MenuItem to="/profile" onClick={close}>{texts.header.userMenu.profile}</MenuItem>
          <MenuItem to="/my-lists" onClick={close}>{texts.header.userMenu.myLists}</MenuItem>
          <MenuItem to="/my-games" onClick={close}>{texts.header.userMenu.myGames}</MenuItem>
          <MenuItem to="/reviews" onClick={close}>{texts.header.userMenu.reviews}</MenuItem>
        </Panel>
      )}
    </Wrapper>
  )
}
