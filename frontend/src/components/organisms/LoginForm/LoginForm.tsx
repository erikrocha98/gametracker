import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import styled from 'styled-components'
import { loginSchema } from './loginSchema'
import type { LoginFormData } from './loginSchema'
import { FormField } from '../../molecules/FormField'
import { GoogleButton } from '../../molecules/GoogleButton'

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleFormSubmit = useCallback(
    (data: LoginFormData) => {
      if (onSubmit) {
        onSubmit(data)
      } else {
        console.log(data)
      }
    },
    [onSubmit],
  )

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
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
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Entrar
      </Button>
      <Divider sx={{ color: 'text.secondary', fontSize: '12px' }}>OU</Divider>
      <GoogleButton />
    </Form>
  )
}
