import { AppPageShell } from "@/components/app-page-shell"
import { ProviderServicesTable } from "@/components/provider-services-table"

export default function Page() {
  return (
    <AppPageShell pageTitle="Service Providers">
      <ProviderServicesTable />
    </AppPageShell>
  )
}
