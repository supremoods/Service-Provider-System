import { z } from "zod"

export const signupRoles = ["role_1", "role_2", "role_3"] as const
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
const mobileNumberRegex = /^(?:\+639|09)\d{9}$/

export const signupFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(50, "First name must be at most 50 characters"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(50, "Last name must be at most 50 characters"),
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .regex(
        usernameRegex,
        "Username must be 3-30 characters and use only letters, numbers, or underscores"
      ),
    mobileNumber: z
      .string()
      .trim()
      .regex(
        mobileNumberRegex,
        "Mobile number must start with +63 or 09 (example: +639123456789 or 09123456789)"
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Enter a valid email address"),
    role: z.enum(signupRoles, {
      error: "Select a valid role",
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export type SignupFormValues = z.infer<typeof signupFormSchema>

export const signupFormFieldKeys = [
  "firstName",
  "lastName",
  "username",
  "mobileNumber",
  "email",
  "role",
  "password",
  "confirmPassword",
] as const

export type SignupFormFieldKey = (typeof signupFormFieldKeys)[number]

export type SignupFormErrors = Partial<Record<SignupFormFieldKey, string[]>>

export const initialSignupFormValues: SignupFormValues = {
  firstName: "",
  lastName: "",
  username: "",
  mobileNumber: "",
  email: "",
  role: "role_1",
  password: "",
  confirmPassword: "",
}
