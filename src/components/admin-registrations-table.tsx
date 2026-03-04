"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { AccountModel, AccountStatus, AccountType } from "@/modules/accounts/models/account.model"
import { getAccounts } from "@/repositories/account.repository"

type AccountFilter = "all" | AccountType
type StatusFilter = "all" | AccountStatus

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

function statusClasses(status: AccountStatus) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
  }

  return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getStatusIcon(status: AccountStatus) {
  if (status === "approved") {
    return CheckCircle2
  }

  if (status === "rejected") {
    return XCircle
  }

  return Clock3
}

export function AdminRegistrationsTable() {
  const [registrations, setRegistrations] = useState<AccountModel[]>(() =>
    getAccounts()
  )
  const [search, setSearch] = useState("")
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const counts = useMemo(() => {
    return registrations.reduce(
      (acc, current) => {
        acc.total += 1
        acc[current.status] += 1
        return acc
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    )
  }, [registrations])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return registrations.filter((record) => {
      if (accountFilter !== "all" && record.account_type !== accountFilter) {
        return false
      }

      if (statusFilter !== "all" && record.status !== statusFilter) {
        return false
      }

      if (!query) {
        return true
      }

      const fullName = `${record.first_name} ${record.last_name}`.toLowerCase()

      return (
        record.id.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        record.email.toLowerCase().includes(query) ||
        record.mobile_number.toLowerCase().includes(query) ||
        record.role_type.toLowerCase().includes(query)
      )
    })
  }, [registrations, search, accountFilter, statusFilter])

  function setStatus(id: string, status: AccountStatus) {
    setRegistrations((prev) =>
      prev.map((record) => {
        if (record.id !== id) {
          return record
        }

        return { ...record, status }
      })
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Registrations</CardTitle>
        <CardDescription>
          Manage user and service provider registrations based on your backend
          model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{counts.total}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold">{counts.pending}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Approved</p>
            <p className="text-lg font-semibold">{counts.approved}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Rejected</p>
            <p className="text-lg font-semibold">{counts.rejected}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, role, mobile..."
            className="md:col-span-2"
          />
          <select
            data-slot="input"
            value={accountFilter}
            onChange={(event) =>
              setAccountFilter(event.target.value as AccountFilter)
            }
            className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">All Account Types</option>
            <option value="admin">Admin</option>
            <option value="provider">Provider</option>
            <option value="customer">Customer</option>
          </select>
          <select
            data-slot="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Mobile</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Last Login</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((record) => {
                  const StatusIcon = getStatusIcon(record.status)

                  return (
                    <tr key={record.id} className="border-t align-top">
                      <td className="px-3 py-3 font-mono text-xs">{record.id}</td>
                      <td className="px-3 py-3">
                        {record.first_name} {record.last_name}
                      </td>
                      <td className="px-3 py-3">{record.email}</td>
                      <td className="px-3 py-3">{record.mobile_number}</td>
                      <td className="px-3 py-3">{record.role_type}</td>
                      <td className="px-3 py-3">
                        {titleCase(record.account_type)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses(
                            record.status
                          )}`}
                        >
                          <StatusIcon className="mr-1 size-3.5" />
                          {titleCase(record.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3">{formatDate(record.created_at)}</td>
                      <td className="px-3 py-3">{formatDate(record.last_login)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setStatus(record.id, "approved")}
                            disabled={record.status === "approved"}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(record.id, "rejected")}
                            disabled={record.status === "rejected"}
                          >
                            Reject
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Change status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setStatus(record.id, "approved")}
                                disabled={record.status === "approved"}
                              >
                                <CheckCircle2 className="size-4" />
                                Approve
                                {record.status === "approved" ? (
                                  <DropdownMenuShortcut>Current</DropdownMenuShortcut>
                                ) : null}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setStatus(record.id, "rejected")}
                                disabled={record.status === "rejected"}
                                variant="destructive"
                              >
                                <XCircle className="size-4" />
                                Reject
                                {record.status === "rejected" ? (
                                  <DropdownMenuShortcut>Current</DropdownMenuShortcut>
                                ) : null}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
