"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  LogOut, 
  Menu,
  User as UserIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { name: "Admin Panel", href: "/dashboard/admin", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 border-r dark:bg-gray-900 border-gray-200 dark:border-gray-800 md:w-64">
      {/* Logo Area */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <span className="text-2xl">🐊</span>
             <span>CourtLink</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
             const isActive = pathname === item.href;
             return (
                <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
                >
                <item.icon className="h-4 w-4" />
                {item.name}
                </Link>
             )
          })}
        </nav>
      </div>
      
      {/* User Footer */}
      <div className="mt-auto border-t p-4">
            <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">User</div>
                 </div>
                 
                 <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                    <LogOut className="h-4 w-4 text-gray-500" />
                 </Button>
            </div>
      </div>
    </div>
  );
}
