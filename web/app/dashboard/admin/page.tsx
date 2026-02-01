"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
    LayoutDashboard, 
    CalendarCheck, 
    PlusCircle, 
    Trash2, 
    Loader2, 
    TrendingUp, 
    Users, 
    DollarSign 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fetchUserAttributes } from "aws-amplify/auth"; // For deleting booking as admin (needs email usually, but admin delete might vary)

// Types
interface Booking {
  booking_id: number;
  customer_name: string;
  customer_email: string;
  court_name: string;
  sport_name: string;
  slot_time: string; // "10:00 - 11:00"
  booking_status: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ totalBookings: 0, totalRevenue: 0, activeUsers: 0 });
    
    // New Court Form State
    const [courtName, setCourtName] = useState("");
    const [courtLocation, setCourtLocation] = useState("");
    const [sportName, setSportName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 1. Check Auth
        const isAuthenticated = localStorage.getItem("adminAuthenticated");
        if (!isAuthenticated) {
            router.push("/admin/login");
            return;
        }

        // 2. Load Data
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const res = await fetch("http://localhost:8080/admin/allBookings");
            if (!res.ok) throw new Error("Failed to fetch bookings");
            const data: Booking[] = await res.json();
            
            setBookings(data || []);
            
            // Calculate Stats
            const uniqueUsers = new Set(data?.map(b => b.customer_email)).size;
            setStats({
                totalBookings: data?.length || 0,
                totalRevenue: (data?.length || 0) * 15, // Assuming $15 booking fee for stats
                activeUsers: uniqueUsers
            });

        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    }

    const handleCreateCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:8080/CreateCourt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Court_Name: courtName,
                    Court_Location: courtLocation,
                    Sport_name: sportName,
                    Court_Status: 1, // Available
                    Court_Capacity: 4
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create court");
            }

            toast.success("Court Created Successfully!");
            setCourtName("");
            setCourtLocation("");
            // Refresh stats or court list if we had one
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelBooking = async (id: number, email: string) => {
         if(!confirm("Are you sure you want to cancel this booking?")) return;
         
         try {
             const res = await fetch("http://localhost:8080/cancelBooking", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ booking_id: id, email: email }) // Admin impersonating user for cancel
             });
             
             if (!res.ok) throw new Error("Cancellation failed");
             
             toast.success("Booking Cancelled");
             fetchData(); // Refresh list

         } catch (error) {
             toast.error("Failed to cancel booking");
         }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage courts, bookings, and users.</p>
                    </div>
                    <Button variant="outline" onClick={() => {
                        localStorage.removeItem("adminAuthenticated");
                        router.push("/admin/login");
                    }}>
                        Sign Out
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalBookings}</div>
                            <p className="text-xs text-muted-foreground">+180 since last week</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeUsers}</div>
                            <p className="text-xs text-muted-foreground">+12 since yesterday</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="bookings" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="bookings">All Bookings</TabsTrigger>
                        <TabsTrigger value="courts">Manage Courts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bookings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Bookings</CardTitle>
                                <CardDescription>A list of all reservations made by users.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Court Info</TableHead>
                                                <TableHead>Time Slot</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bookings.map((booking) => (
                                                <TableRow key={booking.booking_id}>
                                                    <TableCell className="font-medium">{booking.booking_id}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{booking.customer_name}</div>
                                                        <div className="text-xs text-gray-500">{booking.customer_email}</div>
                                                    </TableCell>
                                                    <TableCell>{booking.court_name} ({booking.sport_name})</TableCell>
                                                    <TableCell>{booking.slot_time}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                            {booking.booking_status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleCancelBooking(booking.booking_id, booking.customer_email)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {bookings.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">
                                                        No bookings found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="courts" className="space-y-4">
                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle>Add New Court</CardTitle>
                                <CardDescription>Create a new court space for bookings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateCourt} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_name">Court Name</Label>
                                        <Input 
                                            id="c_name" 
                                            placeholder="Tennis Court 5" 
                                            value={courtName}
                                            onChange={(e) => setCourtName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_sport">Sport</Label>
                                        <Select onValueChange={setSportName} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select sport" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tennis">Tennis</SelectItem>
                                                <SelectItem value="Badminton">Badminton</SelectItem>
                                                <SelectItem value="Squash">Squash</SelectItem>
                                                <SelectItem value="Pickleball">Pickleball</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_loc">Location</Label>
                                        <Input 
                                            id="c_loc" 
                                            placeholder="North Wing" 
                                            value={courtLocation}
                                            onChange={(e) => setCourtLocation(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-[#005B8D]" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Create Court</>}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
