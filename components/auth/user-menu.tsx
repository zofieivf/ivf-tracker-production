"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, UserPlus, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthStore } from "@/lib/auth-store"

export function UserMenu() {
  const router = useRouter()
  const { currentUser, getAllUsers, switchUser, logoutUser, deleteAccount } = useAuthStore()
  const [showUserSwitcher, setShowUserSwitcher] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const users = getAllUsers()

  if (!currentUser) return null

  const handleSwitchUser = async (userId: string) => {
    try {
      await switchUser(userId)
      setShowUserSwitcher(false)
      router.refresh()
    } catch (err) {
      console.error('Failed to switch user:', err)
    }
  }

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
    router.refresh()
  }

  const handleDeleteAccount = async (userId: string) => {
    try {
      await deleteAccount(userId)
      setShowDeleteDialog(false)
      setUserToDelete(null)
      
      // If we deleted the current user, redirect to login
      if (userId === currentUser.id) {
        router.push("/login")
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to delete account:', err)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                @{currentUser.username}
              </p>
              {currentUser.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {users.length > 1 && (
            <>
              <DropdownMenuItem onClick={() => setShowUserSwitcher(true)}>
                <Users className="mr-2 h-4 w-4" />
                <span>Switch Account</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={() => router.push("/login")}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Add Account</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => {
              setUserToDelete(currentUser.id)
              setShowDeleteDialog(true)
            }}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Switcher Dialog */}
      <Dialog open={showUserSwitcher} onOpenChange={setShowUserSwitcher}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Account</DialogTitle>
            <DialogDescription>
              Select an account to switch to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {users
              .filter(user => user.id !== currentUser.id)
              .map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSwitchUser(user.id)}
                  className="flex items-center w-full p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation()
                      setUserToDelete(user.id)
                      setShowDeleteDialog(true)
                      setShowUserSwitcher(false)
                    }}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This will permanently delete all IVF data, cycles, and medications for{" "}
              <span className="font-medium">
                {userToDelete ? users.find(u => u.id === userToDelete)?.displayName : "this user"}
              </span>. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && handleDeleteAccount(userToDelete)}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}