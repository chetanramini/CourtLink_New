"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CalendarCheck,
    PlusCircle,
    Trash2,
    Loader2,
    Users,
    DollarSign,
    Dumbbell,
    MapPin,
    RefreshCw,
    Activity
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

// Types
interface Booking {
    booking_id: number;
    customer_name: string;
    customer_ufid: string; // Added field
    customer_email: string;
    court_name: string;
    sport_name: string;
    slot_time: string;
    booking_status: string;
}

interface Sport {
    Sport_ID: number;
    Sport_name: string;
}

interface Court {
    Court_ID: number;
    Court_Name: string;
    Court_Location: string;
    Court_Status: number;
    Sport_id: number;
    Sport: Sport; // Nested sport object
}

export default function AdminDashboard() {
    const router = useRouter();

    // Data States
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms
    const [newSportName, setNewSportName] = useState("");
    const [newCourt, setNewCourt] = useState({ name: "", location: "", sportName: "" });

    // Stats
    const stats = {
        totalRevenue: bookings.length * 15,
        totalBookings: bookings.length,
        activeUsers: new Set(bookings.map(b => b.customer_email)).size
    };

    useEffect(() => {
        checkAuthAndLoadData();
    }, []);

    const checkAuthAndLoadData = async () => {
        const isAuthenticated = localStorage.getItem("adminAuthenticated");
        if (!isAuthenticated) {
            router.push("/admin/login");
            return;
        }
        await loadAllData();
    };

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchBookings(),
                fetchSports(),
                fetchCourts()
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await fetch("http://localhost:8080/admin/allBookings");
            if (res.ok) setBookings(await res.json() || []);
        } catch (e) { toast.error("Failed to load bookings"); }
    };

    const fetchSports = async () => {
        try {
            const res = await fetch("http://localhost:8080/ListSports");
            if (res.ok) setSports(await res.json() || []);
        } catch (e) { toast.error("Failed to load sports"); }
    };

    const fetchCourts = async () => {
        try {
            const res = await fetch("http://localhost:8080/ListCourts");
            if (res.ok) setCourts(await res.json() || []);
        } catch (e) { toast.error("Failed to load courts"); }
    };

    // --- Actions ---

    const handleCancelBooking = async (id: number) => {
        if (!confirm("Force cancel this booking? This cannot be undone.")) return;
        try {
            const res = await fetch("http://localhost:8080/admin/cancelBooking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_id: id })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Booking Cancelled");
            fetchBookings();
        } catch (e) { toast.error("Cancellation failed"); }
    };

    const handleDeleteAllBookings = async () => {
        if (!confirm("WARNING: This will DELETE ALL BOOKINGS and reset Booking IDs to 0. This cannot be undone!")) return;
        try {
            const res = await fetch("http://localhost:8080/admin/deleteAllBookings", {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("All Bookings Deleted & IDs Reset");
            fetchBookings();
        } catch (e) { toast.error("Failed to delete all bookings"); }
    };

    const handleCreateSport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSportName) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:8080/CreateSport", {
                method: "POST",
                body: JSON.stringify({ Sport_name: newSportName })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Sport Created");
            setNewSportName("");
            fetchSports();
        } catch (e) { toast.error("Failed to create sport"); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteSport = async (name: string) => {
        if (!confirm(`Delete sport "${name}"? This will DELETE ALL associated courts and bookings!`)) return;
        try {
            const res = await fetch("http://localhost:8080/DeleteSport", {
                method: "DELETE",
                body: JSON.stringify({ Sport_name: name })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Sport Deleted");
            loadAllData(); // Refresh everything as cascading delete happens
        } catch (e) { toast.error("Failed to delete sport"); }
    };

    const handleResetSportCourts = async (name: string) => {
        if (!confirm(`Reset all "${name}" courts? All slots will become available.`)) return;
        try {
            const res = await fetch("http://localhost:8080/ResetSportCourts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Sport_name: name })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Courts Reset Successfully");
            fetchBookings(); // Refresh bookings
        } catch (e) { toast.error("Failed to reset courts"); }
    };

    const handleCreateCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:8080/CreateCourt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Court_Name: newCourt.name,
                    Court_Location: newCourt.location,
                    Sport_name: newCourt.sportName,
                    Court_Status: 1,
                    Court_Capacity: 4 // default
                })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Court Created");
            setNewCourt({ name: "", location: "", sportName: "" });
            fetchCourts();
        } catch (e) { toast.error("Failed to create court"); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteCourt = async (name: string) => {
        if (!confirm(`Delete court "${name}"?`)) return;
        try {
            const res = await fetch("http://localhost:8080/DeleteCourt", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Court_Name: name })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Court Deleted");
            fetchCourts();
            fetchBookings(); // Linked bookings might be gone
        } catch (e) { toast.error("Failed to delete court"); }
    };

    const handleResetCourt = async (name: string) => {
        try {
            const res = await fetch("http://localhost:8080/resetCourtSlots", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ court_name: name })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Court Reset");
            fetchBookings(); // Refresh bookings
        } catch (e) { toast.error("Failed to reset court"); }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="h-10 w-10 animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Portal</h1>
                        <p className="text-gray-500">Full control over the CourtLink system.</p>
                    </div>
                    <Button variant="outline" onClick={() => {
                        localStorage.clear(); // Clear everything (admin auth, user data, etc.)
                        router.push("/admin/login");
                    }}>
                        Sign Out
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-white p-1 border">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100"><LayoutDashboard className="mr-2 h-4 w-4" />Overview</TabsTrigger>
                        <TabsTrigger value="bookings" className="data-[state=active]:bg-gray-100"><CalendarCheck className="mr-2 h-4 w-4" />Bookings</TabsTrigger>
                        <TabsTrigger value="sports" className="data-[state=active]:bg-gray-100"><Dumbbell className="mr-2 h-4 w-4" />Manage Sports</TabsTrigger>
                        <TabsTrigger value="courts" className="data-[state=active]:bg-gray-100"><MapPin className="mr-2 h-4 w-4" />Manage Courts</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">${stats.totalRevenue}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{stats.totalBookings}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{stats.activeUsers}</div></CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Bookings Tab */}
                    <TabsContent value="bookings">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>All Reservations</CardTitle>
                                    <CardDescription>Manage and cancel user bookings.</CardDescription>
                                </div>
                                <Button variant="destructive" size="sm" onClick={handleDeleteAllBookings}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete All Bookings (Reset IDs)
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>UFID</TableHead>
                                            <TableHead>Sport</TableHead>
                                            <TableHead>Court</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookings.map((b) => (
                                            <TableRow key={b.booking_id}>
                                                <TableCell>{b.booking_id}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{b.customer_name}</div>
                                                    <div className="text-xs text-gray-500">{b.customer_email}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{b.customer_ufid || "N/A"}</TableCell>
                                                <TableCell>{b.sport_name}</TableCell>
                                                <TableCell>{b.court_name}</TableCell>
                                                <TableCell>{b.slot_time}</TableCell>
                                                <TableCell><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{b.booking_status}</span></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleCancelBooking(b.booking_id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {bookings.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center">No bookings found.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sports Tab */}
                    <TabsContent value="sports" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle>Add New Sport</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateSport} className="flex gap-4">
                                        <Input placeholder="Sport Name (e.g. Fencing)" value={newSportName} onChange={e => setNewSportName(e.target.value)} required />
                                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add</Button>
                                    </form>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Existing Sports</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {sports.map(s => (
                                                <TableRow key={s.Sport_ID}>
                                                    <TableCell className="font-medium">{s.Sport_name}</TableCell>
                                                    <TableCell className="text-right flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleResetSportCourts(s.Sport_name)} title="Reset all courts">
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSport(s.Sport_name)} title="Delete Sport">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Courts Tab */}
                    <TabsContent value="courts" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Add Court Form */}
                            <Card className="md:col-span-1 h-fit">
                                <CardHeader><CardTitle>Add Court</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateCourt} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Court Name</Label>
                                            <Input value={newCourt.name} onChange={e => setNewCourt({ ...newCourt, name: e.target.value })} placeholder="e.g. Tennis Court 3" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sport</Label>
                                            <Select onValueChange={val => setNewCourt({ ...newCourt, sportName: val })} required>
                                                <SelectTrigger><SelectValue placeholder="Select Sport" /></SelectTrigger>
                                                <SelectContent>
                                                    {sports.map(s => <SelectItem key={s.Sport_ID} value={s.Sport_name}>{s.Sport_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input value={newCourt.location} onChange={e => setNewCourt({ ...newCourt, location: e.target.value })} placeholder="e.g. East Wing" required />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-4 w-4" />} Create Court
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Courts List */}
                            <Card className="md:col-span-2">
                                <CardHeader><CardTitle>Manage Courts</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Sport</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {courts.map(c => (
                                                <TableRow key={c.Court_ID}>
                                                    <TableCell className="font-medium">{c.Court_Name}</TableCell>
                                                    <TableCell>{c.Sport?.Sport_name || c.Sport_id || "Unknown"}</TableCell>
                                                    {/* Fallback if Sport object isn't preloaded, normally ListCourts should preload it */}
                                                    <TableCell>{c.Court_Location}</TableCell>
                                                    <TableCell className="text-right flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleResetCourt(c.Court_Name)} title="Reset Slots">
                                                            <RefreshCw className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCourt(c.Court_Name)} title="Delete Court">
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {courts.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center">No courts found.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
