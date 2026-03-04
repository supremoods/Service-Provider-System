"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AccountModel } from "@/modules/accounts/models/account.model"
import {
  buildUserSearch,
  getRegisteredProviders,
  type SearchableUserField,
  type UsersPagination,
} from "@/repositories/account.repository"

const SEARCH_FIELDS: { value: SearchableUserField; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "mobile_number", label: "Mobile" },
  { value: "role_type", label: "Role" },
]

const DEFAULT_PAGINATION: UsersPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
}

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
  const [records, setRecords] = useState<AccountModel[]>([])
  const [search, setSearch] = useState("")
  const [searchField, setSearchField] =
    useState<SearchableUserField>("first_name")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<UsersPagination>(
    DEFAULT_PAGINATION
  )
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let isActive = true

    async function loadProviders() {
      setIsLoading(true)
      setLoadError("")

      try {
        const searchQuery = buildUserSearch(searchField, search, "like")
        const result = await getRegisteredProviders({
          paginate: true,
          limit,
          page,
          search: searchQuery,
        })

        if (!isActive) {
          return
        }

        setRecords(result.items)
        setPagination(result.pagination)
      } catch (error: unknown) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load service providers."
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadProviders()

    return () => {
      isActive = false
    }
  }, [limit, page, search, searchField])

  const filteredRows = useMemo(() => records, [records])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Services</CardTitle>
        <CardDescription>
          Loaded from `/users` with pagination and search. Showing only approved
          provider records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Total (Current Page)</p>
            <p className="text-lg font-semibold">{records.length}</p>
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

        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search value..."
            className="md:col-span-3"
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
        </div>

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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    Loading providers...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
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
