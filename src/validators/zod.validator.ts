import { z } from "zod"

export function mapZodIssuesToFieldErrors<Field extends string>(
  issues: z.ZodIssue[],
  fieldKeys: readonly Field[]
): Partial<Record<Field, string[]>> {
  return issues.reduce<Partial<Record<Field, string[]>>>((acc, issue) => {
    const [field] = issue.path

    if (
      typeof field !== "string" ||
      !fieldKeys.includes(field as Field)
    ) {
      return acc
    }

    const typedField = field as Field
    acc[typedField] = [...(acc[typedField] ?? []), issue.message]

    return acc
  }, {})
}
