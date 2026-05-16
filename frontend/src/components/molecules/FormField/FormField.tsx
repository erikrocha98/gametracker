import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import styled from 'styled-components'

interface FormFieldProps<T extends FieldValues> {
  label: string
  name: Path<T>
  register: UseFormRegister<T>
  error?: string
  type?: string
  placeholder?: string
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
}: FormFieldProps<T>) {
  const { ref, ...rest } = register(name)
  return (
    <Wrapper>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}
      </Typography>
      <TextField
        inputRef={ref}
        {...rest}
        type={type}
        placeholder={placeholder}
        error={!!error}
      />
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Wrapper>
  )
}
