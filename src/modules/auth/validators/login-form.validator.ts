import { z } from "zod"

export const loginFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const loginFormFieldKeys = ["username", "password"] as const

export type LoginFormFieldKey = (typeof loginFormFieldKeys)[number]

export type LoginFormErrors = Partial<Record<LoginFormFieldKey, string[]>>

export const initialLoginFormValues: LoginFormValues = {
  username: "",
  password: "",
}
