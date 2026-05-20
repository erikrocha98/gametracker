import { useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import styled from 'styled-components'
import { loginSchema } from './loginSchema'
import type { LoginFormData } from './loginSchema'
import { FormField } from '../../molecules/FormField'
import { GoogleButton } from '../../molecules/GoogleButton'

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void> | void
  apiError?: string | null
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export function LoginForm({ onSubmit, apiError }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember_me: false },
  })

  const handleFormSubmit = useCallback(
    async (data: LoginFormData) => {
      if (onSubmit) await onSubmit(data)
    },
    [onSubmit],
  )

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      {apiError && <Alert severity="error">{apiError}</Alert>}
      <FormField
        label="E-mail"
        name="email"
        register={register}
        error={errors.email?.message}
        placeholder="voce@exemplo.com"
      />
      <FormField
        label="Senha"
        name="password"
        register={register}
        error={errors.password?.message}
        type="password"
        showPasswordToggle
      />
      <Controller
        name="remember_me"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox checked={field.value} onChange={field.onChange} size="small" />}
            label="Lembrar de mim"
          />
        )}
      />
      <Button type="submit" variant="contained" color="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
      <Divider sx={{ color: 'text.secondary', fontSize: '12px' }}>OU</Divider>
      <GoogleButton />
    </Form>
  )
}
