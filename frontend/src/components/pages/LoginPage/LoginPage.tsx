import { AuthTemplate } from '../../templates/AuthTemplate'
import { AuthCard } from '../../organisms/AuthCard'

export function LoginPage() {
  return (
    <AuthTemplate>
      <AuthCard initialTab="login" />
    </AuthTemplate>
  )
}
