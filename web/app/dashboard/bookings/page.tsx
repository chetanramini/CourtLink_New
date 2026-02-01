"use client";

import { useEffect, useState, Suspense } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Clock, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Booking {
  booking_id: number;
  court_name: string;
  sport_name: string;
  slot_time: string;
  booking_status: string;
}

function BookingsContent() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    useEffect(() => {
        async function loadBookings() {
            try {
                const attributes = await fetchUserAttributes();
                const userEmail = attributes.email;
                if (!userEmail) {
                    router.push("/login");
                    return;
                }
                setEmail(userEmail);

                const res = await fetch(`http://localhost:8080/listBookings?email=${encodeURIComponent(userEmail)}`);
                if (!res.ok) {
                    if (res.status === 404) {
                         setBookings([]);
                         return;
                    }
                    throw new Error("Failed to fetch bookings");
                }
                const data = await res.json();
                setBookings(data || []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load bookings");
            } finally {
                setLoading(false);
            }
        }
        loadBookings();
    }, [router]);

    const handleCancel = async (bookingId: number) => {
        if (!email) return;
        setCancellingId(bookingId);
        try {
            const res = await fetch("http://localhost:8080/cancelBooking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_id: bookingId,
                    email: email
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Cancellation failed");
            }

            toast.success("Booking Cancelled", {
                description: "Your reservation has been removed."
            });

            // Remove from list
            setBookings(prev => prev.filter(b => b.booking_id !== bookingId));

        } catch (error: any) {
             toast.error("Cancellation Failed", {
                description: error.message
             });
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
           <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#005B8D] to-[#F26A2E]">
               <Loader2 className="h-12 w-12 animate-spin text-white" />
           </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#005B8D] to-[#F26A2E] p-8 text-white font-sans">
             <div className="max-w-7xl mx-auto">
                 {/* Header */}
                 <div className="p-6 -mt-5">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/20 hover:text-white -ml-4">
                            <ArrowLeft className="h-6 w-6 mr-2" /> Back
                        </Button>
                    </div>
                    <div className="mb-4 text-left">
                        <h2 className="text-4xl font-bold inline-block pl-2 uppercase tracking-wide">
                            MY BOOKINGS
                        </h2>
                        <div className="w-[200px] h-2 bg-[#FA4616] mt-4 rounded-full"></div>
                    </div>
                 </div>

                 {/* Bookings List */}
                 {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                        <h3 className="text-2xl font-semibold text-white mb-4">No active bookings found</h3>
                         <Button onClick={() => router.push("/dashboard")} className="bg-[#FA4616] hover:bg-[#d13a10] text-white">
                             Find a Court
                         </Button>
                    </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {bookings.map((booking) => (
                             <Card key={booking.booking_id} className="bg-white text-gray-800 border-none shadow-xl rounded-xl overflow-hidden">
                                 <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <CardTitle className="text-xl font-bold text-[#005B8D]">{booking.court_name}</CardTitle>
                                             <CardDescription className="font-medium text-[#FA4616] uppercase tracking-wide text-xs mt-1">
                                                 {booking.sport_name}
                                             </CardDescription>
                                         </div>
                                         <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                             {booking.booking_status}
                                         </Badge>
                                     </div>
                                 </CardHeader>
                                 <CardContent className="pt-6">
                                     <div className="flex items-center gap-3 text-gray-600 mb-2">
                                         <Calendar className="h-5 w-5 text-[#005B8D]" />
                                         <span className="font-medium">Today</span>
                                     </div>
                                     <div className="flex items-center gap-3 text-gray-600">
                                         <Clock className="h-5 w-5 text-[#005B8D]" />
                                         <span className="font-bold text-lg text-gray-800">{booking.slot_time}</span>
                                     </div>
                                 </CardContent>
                                 <CardFooter className="bg-gray-50 border-t border-gray-100 pt-4">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
                                                {cancellingId === booking.booking_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                Cancel Reservation
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to cancel your reservation for <strong>{booking.court_name}</strong> at <strong>{booking.slot_time}</strong>?
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleCancel(booking.booking_id)} className="bg-red-600 hover:bg-red-700">
                                                    Yes, Cancel
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                 </CardFooter>
                             </Card>
                         ))}
                     </div>
                 )}
             </div>
        </div>
    )
}

export default function BookingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingsContent />
        </Suspense>
    )
}
