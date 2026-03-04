"use client"

import { useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getRegisteredProviders } from "@/repositories/account.repository"

function formatDate(value: Date | undefined) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}

export function ProviderServicesTable() {
  const [search, setSearch] = useState("")

  const registeredServices = useMemo(() => {
    return getRegisteredProviders()
  }, [])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return registeredServices
    }

    return registeredServices.filter((record) => {
      const fullName = `${record.first_name} ${record.last_name}`.toLowerCase()

      return (
        record.id.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        record.email.toLowerCase().includes(query) ||
        record.mobile_number.toLowerCase().includes(query) ||
        record.role_type.toLowerCase().includes(query)
      )
    })
  }, [search, registeredServices])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Services</CardTitle>
        <CardDescription>
          Viewing only approved and registered service providers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Total Registered</p>
            <p className="text-lg font-semibold">{registeredServices.length}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Showing</p>
            <p className="text-lg font-semibold">{filteredRows.length}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Status</p>
            <p className="inline-flex items-center gap-1 text-lg font-semibold text-emerald-600">
              <CheckCircle2 className="size-4" />
              Approved
            </p>
          </div>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search provider, email, role, mobile..."
        />

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Provider</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Mobile</th>
                <th className="px-3 py-2 font-medium">Service Role</th>
                <th className="px-3 py-2 font-medium">Registered At</th>
                <th className="px-3 py-2 font-medium">Last Login</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No registered services found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="px-3 py-3 font-mono text-xs">{record.id}</td>
                    <td className="px-3 py-3">
                      {record.first_name} {record.last_name}
                    </td>
                    <td className="px-3 py-3">{record.email}</td>
                    <td className="px-3 py-3">{record.mobile_number}</td>
                    <td className="px-3 py-3">{record.role_type}</td>
                    <td className="px-3 py-3">{formatDate(record.created_at)}</td>
                    <td className="px-3 py-3">{formatDate(record.last_login)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="mr-1 size-3.5" />
                        Approved
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
