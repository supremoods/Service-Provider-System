"use client"

import { useEffect, useMemo, useState } from "react"
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
import type {
  AccountModel,
  AccountStatus,
  AccountType,
} from "@/modules/accounts/models/account.model"
import {
  buildUserSearch,
  buildUserSearchAnd,
  getAccounts,
  type SearchableUserField,
  type UserSearchCondition,
  type UsersPagination,
} from "@/repositories/account.repository"

type AccountFilter = "all" | AccountType
type StatusFilter = "all" | AccountStatus

const SEARCH_FIELDS: { value: SearchableUserField; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "mobile_number", label: "Mobile" },
  { value: "role_type", label: "Role" },
  { value: "account_type", label: "Account Type" },
  { value: "status", label: "Status" },
]

const DEFAULT_PAGINATION: UsersPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
}
const ASSIGNABLE_ACCOUNT_TYPES: AccountType[] = [
  "admin",
  "provider",
  "customer",
]

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
  const [registrations, setRegistrations] = useState<AccountModel[]>([])
  const [pendingAccountTypeDrafts, setPendingAccountTypeDrafts] = useState<
    Record<string, AccountType>
  >({})
  const [search, setSearch] = useState("")
  const [searchField, setSearchField] =
    useState<SearchableUserField>("first_name")
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<UsersPagination>(
    DEFAULT_PAGINATION
  )
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let isActive = true

    async function loadRegistrations() {
      setIsLoading(true)
      setLoadError("")

      try {
        const conditions: UserSearchCondition[] = []

        if (accountFilter !== "all") {
          conditions.push({
            fieldName: "account_type",
            value: accountFilter,
            mode: "exact",
          })
        }

        if (statusFilter !== "all") {
          conditions.push({
            fieldName: "status",
            value: statusFilter,
            mode: "exact",
          })
        }

        const typedSearch = buildUserSearch(searchField, search, "like")
        if (typedSearch) {
          conditions.push({
            fieldName: searchField,
            value: search,
            mode: "like",
          })
        }

        const searchQuery = buildUserSearchAnd(conditions)

        const result = await getAccounts({
          paginate: true,
          limit,
          page,
          search: searchQuery,
        })

        if (!isActive) {
          return
        }

        setRegistrations(result.items)
        setPagination(result.pagination)
        setPendingAccountTypeDrafts((prev) => {
          const next: Record<string, AccountType> = {}

          for (const record of result.items) {
            if (record.status !== "pending") {
              continue
            }

            next[record.id] =
              prev[record.id] ||
              record.account_type ||
              ASSIGNABLE_ACCOUNT_TYPES[0]
          }

          return next
        })
      } catch (error: unknown) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load registrations."
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadRegistrations()

    return () => {
      isActive = false
    }
  }, [accountFilter, limit, page, search, searchField, statusFilter])

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

  const filteredRows = useMemo(() => registrations, [registrations])

  function setStatus(id: string, status: AccountStatus) {
    setRegistrations((prev) =>
      prev.map((record) => {
        if (record.id !== id) {
          return record
        }

        if (status === "approved") {
          const selectedAccountType = pendingAccountTypeDrafts[id]

          if (selectedAccountType) {
            return {
              ...record,
              status,
              account_type: selectedAccountType,
            }
          }
        }

        return { ...record, status }
      })
    )
  }

  function setPendingAccountTypeDraft(id: string, accountType: AccountType) {
    setPendingAccountTypeDrafts((prev) => ({ ...prev, [id]: accountType }))
  }

  function assignPendingAccountType(id: string) {
    const selectedAccountType = pendingAccountTypeDrafts[id]

    if (!selectedAccountType) {
      return
    }

    setRegistrations((prev) =>
      prev.map((record) => {
        if (record.id !== id) {
          return record
        }

        return {
          ...record,
          account_type: selectedAccountType,
        }
      })
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Registrations</CardTitle>
        <CardDescription>
          Loaded from `/users` with backend pagination and search.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Total (Current Page)</p>
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

        <div className="grid gap-3 md:grid-cols-5">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search value..."
            className="md:col-span-2"
          />
          <select
            data-slot="input"
            value={searchField}
            onChange={(event) => {
              setSearchField(event.target.value as SearchableUserField)
              setPage(1)
            }}
            className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {SEARCH_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
          <select
            data-slot="input"
            value={accountFilter}
            onChange={(event) => {
              setAccountFilter(event.target.value as AccountFilter)
              setPage(1)
            }}
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
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter)
              setPage(1)
            }}
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    Loading registrations...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
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
                  const selectedAccountType =
                    pendingAccountTypeDrafts[record.id] ||
                    record.account_type ||
                    ASSIGNABLE_ACCOUNT_TYPES[0]
                  const canAssignAccountType =
                    record.status === "pending" &&
                    selectedAccountType !== record.account_type

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
                          {record.status === "pending" ? (
                            <>
                              <select
                                data-slot="input"
                                value={selectedAccountType}
                                onChange={(event) =>
                                  setPendingAccountTypeDraft(
                                    record.id,
                                    event.target.value as AccountType
                                  )
                                }
                                className="h-8 w-36 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                {ASSIGNABLE_ACCOUNT_TYPES.map((accountType) => (
                                  <option key={accountType} value={accountType}>
                                    {titleCase(accountType)}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => assignPendingAccountType(record.id)}
                                disabled={!canAssignAccountType}
                              >
                                Assign Account Type
                              </Button>
                            </>
                          ) : null}
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} - {pagination.total}{" "}
            total records
          </p>
          <div className="flex items-center gap-2">
            <select
              data-slot="input"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value))
                setPage(1)
              }}
              className="h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={isLoading || !pagination.hasPrevious}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={isLoading || !pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
