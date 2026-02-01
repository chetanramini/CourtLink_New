"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { Search, User as UserIcon, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TopNavbar() {
    const router = useRouter();

    async function handleSignOut() {
        try {
            await signOut();
            router.push("/login"); // Redirect to login after sign out
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }

    return (
        <div className="w-full bg-[#005B8D] text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-2xl transition-transform group-hover:scale-110">🐊</span>
                    <span className="text-xl font-bold tracking-wide">UFCourtLink</span>
                </Link>

                {/* Search Bar (Hidden on mobile) */}
                <div className="hidden md:flex flex-1 max-w-md relative">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                        <Input
                            placeholder="Search..."
                            className="w-full pl-9 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus-visible:ring-white/50 focus-visible:bg-white/30 rounded-full"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <Button variant="secondary" className="hidden sm:flex rounded-full px-6 font-semibold bg-white text-[#005B8D] hover:bg-gray-100" onClick={() => router.push('/dashboard/bookings')}>
                        My Bookings
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-white">
                                <UserIcon className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push('/dashboard/admin')}>
                                Admin Panel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
