import { AppPageShell } from "@/components/app-page-shell"
import { AdminRegistrationsTable } from "@/components/admin-registrations-table"

export default function Page() {
  return (
    <AppPageShell pageTitle="Registrations">
      <AdminRegistrationsTable />
    </AppPageShell>
  )
}
