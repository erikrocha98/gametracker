import { z } from 'zod'

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()\-_=+\[\]{};':",.<>/?\\|`~]/
const SAFE_NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'\-]+$/

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Informe seu nome')
    .max(100, 'Nome muito longo')
    .regex(SAFE_NAME_REGEX, 'Nome contém caracteres inválidos'),
  email: z
    .string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(SPECIAL_CHAR_REGEX, 'Deve conter pelo menos um caractere especial'),
})

export type SignUpFormData = z.infer<typeof signUpSchema>
