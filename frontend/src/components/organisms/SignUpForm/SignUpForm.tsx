import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import styled from 'styled-components'
import { signUpSchema } from './signUpSchema'
import type { SignUpFormData } from './signUpSchema'
import { FormField } from '../../molecules/FormField'
import { GoogleButton } from '../../molecules/GoogleButton'

interface SignUpFormProps {
  onSubmit?: (data: SignUpFormData) => Promise<void> | void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const handleFormSubmit = useCallback(
    async (data: SignUpFormData) => {
      if (onSubmit) await onSubmit(data)
    },
    [onSubmit],
  )

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormField
        label="Usuário"
        name="username"
        register={register}
        error={errors.username?.message}
        placeholder="ex: joao_silva"
      />
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
        placeholder="Mínimo 8 caracteres"
        showPasswordToggle
      />
      <FormField
        label="Confirmar senha"
        name="confirmPassword"
        register={register}
        error={errors.confirmPassword?.message}
        type="password"
        showPasswordToggle
      />
      <Button type="submit" variant="contained" color="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
      <Divider sx={{ color: 'text.secondary', fontSize: '12px' }}>OU</Divider>
      <GoogleButton />
    </Form>
  )
}
