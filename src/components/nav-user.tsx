import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, BadgeCheckIcon, BellIcon, LogOutIcon } from "lucide-react"
import useAuthStore from "@/store/authStore"
import useNotificationStore from "@/store/notificationStore"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

export function NavUser({
  user,
  notificationsPath,
  onAccountClick,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  notificationsPath: string
  onAccountClick?: () => void
}) {
  const { isMobile } = useSidebar()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const initials = getInitials(user.name) || user.email.slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchUnreadCount().catch(() => undefined)
  }, [fetchUnreadCount])

  useEffect(() => {
    const onFocus = () => {
      fetchUnreadCount().catch(() => undefined)
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetchUnreadCount])

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setLogoutDialogOpen(false)
      navigate("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  onAccountClick?.()
                }}
              >
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => navigate(notificationsPath)}
              >
                <BellIcon />
                <span className="flex-1">Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setLogoutDialogOpen(true)
              }}
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

    <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-zinc-900/15 backdrop-blur-none"
        className="max-w-sm gap-0 overflow-hidden rounded-lg border-zinc-200 p-0 shadow-lg sm:max-w-sm"
      >
        <DialogHeader className="space-y-1.5 border-0 px-5 pt-5 pb-0 pr-5">
          <DialogTitle className="text-base font-semibold text-zinc-900">
            Log out?
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            You will need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-2 px-5 pt-4 pb-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isLoggingOut}
            onClick={() => setLogoutDialogOpen(false)}
            className="h-9 rounded-lg border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void handleConfirmLogout()}
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
