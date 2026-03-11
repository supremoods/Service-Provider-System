"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import {
  extractAuthSession,
  register,
} from "@/modules/auth/services/auth.service"
import { getDesignatedModuleRoute } from "@/modules/auth/services/auth-routing.service"
import {
  initialSignupFormValues,
  signupFormFieldKeys,
  signupFormSchema,
  signupRoles,
  type SignupFormErrors,
  type SignupFormFieldKey,
  type SignupFormValues,
} from "@/modules/auth/validators/signup-form.validator"
import {
  getAccountTypeFromAccessToken,
  setBearerTokenCookie,
  setRefreshTokenCookie,
} from "@/proxy/auth-token.proxy"
import { mapZodIssuesToFieldErrors } from "@/validators/zod.validator"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const { toast } = useToast()
  const [values, setValues] = useState<SignupFormValues>(
    initialSignupFormValues
  )
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange<Field extends SignupFormFieldKey>(
    field: Field,
    value: SignupFormValues[Field]
  ) {
    setValues((prev) => ({ ...prev, [field]: value }))

    setErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })

    setSuccessMessage("")
    setFormError("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccessMessage("")
    setFormError("")

    const parsed = signupFormSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(
        mapZodIssuesToFieldErrors(parsed.error.issues, signupFormFieldKeys)
      )
      return
    }

    setErrors({})

    try {
      setIsSubmitting(true)

      await register({
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        username: parsed.data.username,
        email: parsed.data.email,
        mobile_number: parsed.data.mobileNumber,
        role_type: parsed.data.role,
        password_hash: parsed.data.password,
        account_type: "customer",
      })
    
      setValues(initialSignupFormValues)
      const successText = "Registration successful. You can now sign in."
      setSuccessMessage(successText)
      toast({
        title: "Registration successful",
        description: successText,
        variant: "success",
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to register. Please try again."
      setFormError(message)
      toast({
        title: "Unable to register",
        description: message,
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-6 md:grid-cols-2">
              <Field data-invalid={Boolean(errors.firstName?.length)}>
                <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="John"
                  autoComplete="given-name"
                  value={values.firstName}
                  onChange={(event) =>
                    handleChange("firstName", event.target.value)
                  }
                  aria-invalid={Boolean(errors.firstName?.length)}
                  aria-describedby={
                    errors.firstName?.length ? "first-name-error" : undefined
                  }
                />
                <FieldError
                  id="first-name-error"
                  errors={errors.firstName?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.lastName?.length)}>
                <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
                  value={values.lastName}
                  onChange={(event) =>
                    handleChange("lastName", event.target.value)
                  }
                  aria-invalid={Boolean(errors.lastName?.length)}
                  aria-describedby={
                    errors.lastName?.length ? "last-name-error" : undefined
                  }
                />
                <FieldError
                  id="last-name-error"
                  errors={errors.lastName?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.username?.length)}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="john_doe"
                  autoComplete="username"
                  value={values.username}
                  onChange={(event) =>
                    handleChange("username", event.target.value)
                  }
                  aria-invalid={Boolean(errors.username?.length)}
                  aria-describedby={
                    errors.username?.length ? "username-error" : undefined
                  }
                />
                <FieldDescription>
                  3-30 characters, letters, numbers, and underscores only.
                </FieldDescription>
                <FieldError
                  id="username-error"
                  errors={errors.username?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.mobileNumber?.length)}>
                <FieldLabel htmlFor="mobile-number">Mobile Number</FieldLabel>
                <Input
                  id="mobile-number"
                  type="tel"
                  placeholder="+639123456789 or 09123456789"
                  autoComplete="tel"
                  value={values.mobileNumber}
                  onChange={(event) =>
                    handleChange("mobileNumber", event.target.value)
                  }
                  aria-invalid={Boolean(errors.mobileNumber?.length)}
                  aria-describedby={
                    errors.mobileNumber?.length
                      ? "mobile-number-error"
                      : undefined
                  }
                />
                <FieldDescription>
                  Use +639XXXXXXXXX or 09XXXXXXXXX format.
                </FieldDescription>
                <FieldError
                  id="mobile-number-error"
                  errors={errors.mobileNumber?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.email?.length)}>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  aria-invalid={Boolean(errors.email?.length)}
                  aria-describedby={
                    errors.email?.length ? "email-error" : undefined
                  }
                />
                <FieldDescription>
                  Enter a valid email format.
                </FieldDescription>
                <FieldError
                  id="email-error"
                  errors={errors.email?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.role?.length)}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <select
                  id="role"
                  data-slot="input"
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                  value={values.role}
                  onChange={(event) =>
                    handleChange(
                      "role",
                      event.target.value as SignupFormValues["role"]
                    )
                  }
                  aria-invalid={Boolean(errors.role?.length)}
                  aria-describedby={errors.role?.length ? "role-error" : undefined}
                >
                  {signupRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="role-error"
                  errors={errors.role?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.password?.length)}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  aria-invalid={Boolean(errors.password?.length)}
                  aria-describedby={
                    errors.password?.length ? "password-error" : undefined
                  }
                />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
                <FieldError
                  id="password-error"
                  errors={errors.password?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.confirmPassword?.length)}>
                <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(event) =>
                    handleChange("confirmPassword", event.target.value)
                  }
                  aria-invalid={Boolean(errors.confirmPassword?.length)}
                  aria-describedby={
                    errors.confirmPassword?.length
                      ? "confirm-password-error"
                      : undefined
                  }
                />
                <FieldError
                  id="confirm-password-error"
                  errors={errors.confirmPassword?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Account"}
                </Button>
                {formError ? <FieldError>{formError}</FieldError> : null}
                {successMessage ? (
                  <FieldDescription className="text-center text-emerald-600">
                    {successMessage}
                  </FieldDescription>
                ) : null}
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              </Field>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
