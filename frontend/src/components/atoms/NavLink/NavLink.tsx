import { NavLink as RouterNavLink } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'

interface NavLinkProps {
  to: string
  children: React.ReactNode
}

const StyledLink = styled(RouterNavLink)`
  color: ${colors.textSecondary};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.15s;

  &:hover {
    color: ${colors.textPrimary};
  }

  &.active {
    color: ${colors.primary};
  }
`

export function NavLink({ to, children }: NavLinkProps) {
  return <StyledLink to={to}>{children}</StyledLink>
}
