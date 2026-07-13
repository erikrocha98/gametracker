import { z } from 'zod'
import { texts } from '../../../constants/texts'

export const listSchema = z.object({
  name: z
    .string()
    .min(1, texts.myLists.nameRequiredError)
    .max(120, texts.myLists.nameTooLongError),
  description: z.string().optional(),
})

export type ListFormData = z.infer<typeof listSchema>
