import { z } from 'zod'

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_=+[\]{};':",.<>/?\\|`~-]/
const SQL_INJECTION_REGEX =
  /--|;|\/\*|\*\/|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b/i

const noSqlInjection = (v: string) => !SQL_INJECTION_REGEX.test(v)
const SQL_INJECTION_MSG = 'Entrada inválida'

export const signUpSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Mínimo 3 caracteres')
      .max(30, 'Máximo 30 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e _')
      .refine(noSqlInjection, SQL_INJECTION_MSG),
    email: z
      .string()
      .email('E-mail inválido')
      .max(254, 'E-mail muito longo')
      .refine(noSqlInjection, SQL_INJECTION_MSG),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(128, 'Senha muito longa')
      .regex(SPECIAL_CHAR_REGEX, 'Deve conter pelo menos um caractere especial'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Senhas não coincidem',
        path: ['confirmPassword'],
      })
    }
  })

export type SignUpFormData = z.infer<typeof signUpSchema>
