import { z } from 'zod'

const SQL_INJECTION_REGEX =
  /--|;|\/\*|\*\/|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b/i

const noSqlInjection = (v: string) => !SQL_INJECTION_REGEX.test(v)
const SQL_INJECTION_MSG = 'Entrada inválida'

export const loginSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo')
    .refine(noSqlInjection, SQL_INJECTION_MSG),
  password: z
    .string()
    .min(1, 'Informe sua senha')
    .max(128, 'Senha muito longa')
    .refine(noSqlInjection, SQL_INJECTION_MSG),
})

export type LoginFormData = z.infer<typeof loginSchema>
