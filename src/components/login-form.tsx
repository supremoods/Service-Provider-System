"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import {
  initialLoginFormValues,
  loginFormFieldKeys,
  loginFormSchema,
  type LoginFormErrors,
  type LoginFormValues,
} from "@/modules/auth/validators/login-form.validator"
import { mapZodIssuesToFieldErrors } from "@/validators/zod.validator"
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [values, setValues] = useState<LoginFormValues>(initialLoginFormValues)
  const [errors, setErrors] = useState<LoginFormErrors>({})

  function handleChange(
    field: keyof LoginFormValues,
    value: string
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
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = loginFormSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(
        mapZodIssuesToFieldErrors(parsed.error.issues, loginFormFieldKeys)
      )
      return
    }

    setErrors({})
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.username?.length)}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="email"
                  placeholder="Input username"
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
                <FieldError
                  id="username-error"
                  errors={errors.username?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field data-invalid={Boolean(errors.password?.length)}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                 
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  aria-invalid={Boolean(errors.password?.length)}
                  aria-describedby={
                    errors.password?.length ? "password-error" : undefined
                  }
                />
                <FieldError
                  id="password-error"
                  errors={errors.password?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
