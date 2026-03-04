"use client"

import * as React from "react"
import {
  ClipboardList,
  LogOut,
  MoreHorizontal,
  type LucideIcon,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import type { AccountType } from "@/modules/accounts/models/account.model"
import {
  type AuthTokenIdentity,
  clearAuthCookies,
  getAuthIdentityFromAccessToken,
} from "@/proxy/auth-token.proxy"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

type NavGroup = {
  title: string
  visibleFor: AccountType[]
  items: NavItem[]
}

type SidebarData = {
  navMain: NavGroup[]
}

const data = {
  navMain: [
    {
      title: "Admin",
      visibleFor: ["admin"],
      items: [
        {
          title: "Registrations",
          url: "/admin/registrations",
          icon: ClipboardList,
        }
      ],
    },
    {
      title: "Customer",
      visibleFor: ["customer", "provider"],
      items: [
        {
          title: "Service Providers",
          url: "/customer/providers",
          icon: Users,
        }
      ],
    },
    
  ],
} satisfies SidebarData

function getProfileNameAndInitials(identity?: {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
}) {
  const firstName = identity?.first_name?.trim()
  const lastName = identity?.last_name?.trim()

  if (firstName && lastName) {
    return {
      fullName: `${firstName} ${lastName}`,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    }
  }

  const username = identity?.username?.trim()
  if (username) {
    return {
      fullName: username,
      initials: username.slice(0, 2).toUpperCase(),
    }
  }

  const email = identity?.email?.trim()
  if (email) {
    const emailName = email.split("@")[0] ?? email

    return {
      fullName: emailName,
      initials: emailName.slice(0, 2).toUpperCase(),
    }
  }

  return {
    fullName: "Signed In User",
    initials: "SU",
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [identity, setIdentity] = React.useState<AuthTokenIdentity>()
  React.useEffect(() => {
    setIdentity(getAuthIdentityFromAccessToken())
  }, [])
  const accountType = identity?.account_type
  const { fullName, initials } = getProfileNameAndInitials(identity)
  const navMain = data.navMain.filter((group) =>
    accountType ? group.visibleFor.some((role) => role === accountType) : false
  )

  function isRouteActive(url: string) {
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            SPS
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-extrabold">
              Service Provider System
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {initials}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">Signed in</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ml-auto"
                aria-label="User menu"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  clearAuthCookies()
                  router.push("/login")
                }}
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
