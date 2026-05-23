import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { Header } from '../../organisms/Header'

interface MainTemplateProps {
  children: React.ReactNode
}

const Page = styled.div`
  min-height: 100vh;
  background-color: ${colors.backgroundDefault};
`

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`

export function MainTemplate({ children }: MainTemplateProps) {
  return (
    <Page>
      <Header />
      <Main>{children}</Main>
    </Page>
  )
}
