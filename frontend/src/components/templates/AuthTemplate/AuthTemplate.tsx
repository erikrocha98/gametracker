import type { ReactNode } from 'react'
import styled from 'styled-components'
import { Logo } from '../../atoms/Logo'

interface AuthTemplateProps {
  children: ReactNode
}

const Page = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.palette.background.default};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  box-sizing: border-box;
`

export function AuthTemplate({ children }: AuthTemplateProps) {
  return (
    <Page>
      <Logo />
      {children}
    </Page>
  )
}
