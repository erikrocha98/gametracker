import { useState } from 'react'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import styled from 'styled-components'

interface FormFieldProps<T extends FieldValues> {
  label: string
  name: Path<T>
  register: UseFormRegister<T>
  error?: string
  type?: string
  placeholder?: string
  showPasswordToggle?: boolean
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const ErrorText = styled.p`
  color: #f44336;
  font-size: 12px;
  margin: 0;
`

export function FormField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder,
  showPasswordToggle = false,
}: FormFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false)
  const { ref, ...rest } = register(name)

  const resolvedType = showPasswordToggle && type === 'password'
    ? (showPassword ? 'text' : 'password')
    : type

  const endAdornment = showPasswordToggle && type === 'password' ? (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword((prev) => !prev)}
        edge="end"
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        size="small"
      >
        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small"/>}
      </IconButton>
    </InputAdornment>
  ) : undefined

  return (
    <Wrapper>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}
      </Typography>
      <TextField
        inputRef={ref}
        {...rest}
        type={resolvedType}
        placeholder={placeholder}
        error={!!error}
        slotProps={{ input: { endAdornment } }}
      />
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Wrapper>
  )
}
