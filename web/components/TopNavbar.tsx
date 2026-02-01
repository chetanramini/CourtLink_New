"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut, fetchUserAttributes } from "aws-amplify/auth";
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
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [name, setName] = useState("");
    const [ufid, setUfid] = useState("");

    async function handleSignOut() {
        try {
            await signOut();
            // Clear all local session data to prevent data leakage between users
            localStorage.removeItem("userName");
            localStorage.removeItem("userUFID");
            localStorage.removeItem("userProfileCompleted");
            localStorage.removeItem("adminAuthenticated");
            router.push("/login");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }

    useEffect(() => {
        const syncProfile = async () => {
             // Strict separation: Only show Admin profile if we are physically ON an admin route
            const onAdminRoute = pathname?.includes("/admin");

            if (onAdminRoute) {
                setIsAdmin(true);
                setName("Administrator");
                setUfid("System Control");
            } else {
                setIsAdmin(false);
                
                // Try to load from local storage
                const storedName = localStorage.getItem("userName");
                const storedUfid = localStorage.getItem("userUFID");

                if (storedName && storedUfid) {
                    setName(storedName);
                    setUfid(storedUfid);
                }

                // ALWAYS fetch fresh data to sync/update (in case of changes or empty local storage)
                try {
                     const user = await fetchUserAttributes();
                     if (user.email) {
                         const res = await fetch(`http://localhost:8080/GetCustomer?email=${user.email}`);
                         if (res.ok) {
                             const data = await res.json();
                             if (data.name && data.name !== "Gator User") {
                                 setName(data.name);
                                 setUfid(data.ufid || "N/A");
                                 localStorage.setItem("userName", data.name);
                                 localStorage.setItem("userUFID", data.ufid || "N/A");
                                 localStorage.setItem("userProfileCompleted", "true");
                             }
                         }
                     }
                } catch (e) {
                    console.error("Failed to sync navbar profile", e);
                }
            }
        };

        syncProfile();
    }, [pathname]); // Re-run when route changes

    return (
        <div className={`w-full text-white ${isAdmin ? 'bg-gradient-to-r from-gray-900 to-gray-800 shadow-md' : 'bg-transparent'} z-50 relative`}>
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href={isAdmin ? "/dashboard/admin" : "/dashboard"} className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-2xl transition-transform group-hover:scale-110">🐊</span>
                    <span className="text-xl font-bold tracking-wide">
                        {isAdmin ? "UFCourtLink Admin" : "UFCourtLink"}
                    </span>
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
                <div className="flex items-center gap-3">
                    {!isAdmin && (
                        <Button 
                            variant="secondary" 
                            className="hidden sm:flex rounded-full px-5 font-bold shadow-sm bg-white text-[#005B8D] hover:bg-gray-50 border-2 border-transparent hover:border-white/50 transition-all" 
                            onClick={() => router.push('/dashboard/bookings')}
                        >
                            My Bookings
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white pl-2 pr-4 h-11 transition-all">
                                <Avatar className="h-8 w-8 border-2 border-white/80 shadow-sm">
                                    <AvatarFallback className={`text-black font-bold font-sans ${isAdmin ? 'bg-white' : 'bg-[#FA4616] text-white'}`}>
                                        {name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left hidden md:block leading-tight">
                                    <p className="text-sm font-bold truncate max-w-[120px]">{name}</p>
                                    {!isAdmin && <p className="text-[10px] text-white/80 font-mono tracking-wider">{ufid}</p>}
                                    {isAdmin && <p className="text-[10px] text-white/80 font-mono tracking-wider">System Control</p>}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-2">
                            {/* If User, show generic menu. If Admin, just Sign Out */}
                            {!isAdmin && (
                                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="rounded-lg font-medium cursor-pointer">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Profile Settings
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleSignOut} className="rounded-lg font-medium text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
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
