"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner"; // Using Sonner instead of use-toast

import { fetchUserAttributes } from "aws-amplify/auth";

interface CourtAvailability {
    CourtName: string;
    CourtStatus: number;
    CourtID: number;
    SportID: number;
    Slots: number[];
}

function CourtsContent() {
    const searchParams = useSearchParams();
    const sport = searchParams.get("sport");
    const router = useRouter();

    const [courts, setCourts] = useState<CourtAvailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCourt, setSelectedCourt] = useState<CourtAvailability | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Time mapping (0 -> 8:00-9:00, etc.)
    const timeSlotsLabels = [
        "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
        "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
        "16:00 - 17:00", "17:00 - 18:00"
    ];

    useEffect(() => {
        if (!sport) return;

        async function fetchCourts() {
            try {
                const res = await fetch(`http://localhost:8080/getCourts?sport=${sport}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setCourts([]); // No courts found
                        return;
                    }
                    throw new Error("Failed to fetch courts");
                }
                const data = await res.json();
                setCourts(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCourts();
    }, [sport]);

    const handleBookClick = (court: CourtAvailability, slotIndex: number) => {
        setSelectedCourt(court);
        setSelectedSlot(slotIndex);
        setIsBookingDetailsOpen(true);
    };

    const confirmBooking = async () => {
        if (!selectedCourt || selectedSlot === null) return;
        setBookingLoading(true);

        try {
            // 1. Get User Email
            const attributes = await fetchUserAttributes();
            const email = attributes.email;

            if (!email) {
                toast.error("User email not found. Please log in again.");
                return;
            }

            // 2. Call Booking API
            const response = await fetch("http://localhost:8080/CreateBooking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    court_id: selectedCourt.CourtID,
                    sport_id: selectedCourt.SportID,
                    email: email,
                    slot_index: selectedSlot
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Booking failed");
            }

            // 3. Success
            toast.success("Booking Confirmed! 🐊", {
                description: `You booked ${selectedCourt.CourtName} for ${timeSlotsLabels[selectedSlot]}.`,
                duration: 4000,
            });
            setIsBookingDetailsOpen(false);

            // 4. Refresh Courts to update availability
            const res = await fetch(`http://localhost:8080/getCourts?sport=${sport}`);
            const data = await res.json();
            setCourts(data || []);

        } catch (err: any) {
            console.error(err);
            toast.error("Booking Failed", {
                description: err.message,
            });
        } finally {
            setBookingLoading(false);
        }
    };

    if (!sport) {
        return <div className="p-8 text-white">Please select a sport from the dashboard.</div>
    }

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
                            AVAILABLE {sport} COURTS
                        </h2>
                        <div className="w-[75%] h-2 bg-[#FA4616] mt-4 rounded-full"></div>
                    </div>
                </div>

                {error && <div className="text-red-200 bg-red-900/50 p-6 rounded-xl border border-red-500/30 backdrop-blur-sm">Error: {error}</div>}

                {/* Empty State */}
                {courts.length === 0 && !loading && !error && (
                    <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                        <h3 className="text-2xl font-semibold text-white">No courts available for {sport}</h3>
                    </div>
                )}

                {/* Courts Grid */}
                <div className="grid grid-cols-1 gap-8">
                    {courts.map((court) => (
                        <Card key={court.CourtID} className="overflow-hidden bg-white border-none shadow-xl rounded-2xl text-gray-800">
                            <div className="flex flex-col md:flex-row h-full">
                                {/* Left: Info */}
                                <div className="p-8 md:w-1/3 flex flex-col justify-between bg-gray-50 border-r border-gray-100">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900">{court.CourtName}</h3>
                                            <Badge className={`${court.CourtStatus === 1 ? "bg-green-500 hover:bg-green-600" : "bg-red-500"} text-white px-3 py-1 text-sm`}>
                                                {court.CourtStatus === 1 ? "Available" : "Closed"}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-500 font-medium flex items-center gap-2 mt-4">
                                            <Clock className="h-5 w-5 text-[#005B8D]" />
                                            Operating Hours: 08:00 - 18:00
                                        </p>
                                    </div>
                                    {/* Placeholder Image */}
                                    <div className="mt-8 rounded-xl bg-gray-200 h-40 w-full flex items-center justify-center text-gray-400">
                                        Court Image
                                    </div>
                                </div>

                                {/* Right: Slots */}
                                <div className="p-8 md:w-2/3">
                                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
                                        <Clock className="h-5 w-5 text-[#FA4616]" />
                                        {court.CourtStatus === 1 ? "Select a Time Slot" : "No Slots Available"}
                                    </h4>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {court.Slots.map((status, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                disabled={status === 0 || court.CourtStatus !== 1}
                                                className={`
                                        h-auto py-3 px-2 flex flex-col items-center gap-1 border-2 transition-all
                                        ${status === 1
                                                        ? 'border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-400 text-green-900'
                                                        : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed opacity-60'}
                                    `}
                                                onClick={() => handleBookClick(court, index)}
                                            >
                                                <span className="text-sm font-bold">{timeSlotsLabels[index]}</span>
                                                <div className="mt-1">
                                                    {status === 1 ?
                                                        <span className="text-[10px] uppercase font-bold text-green-600 bg-green-200 px-2 py-0.5 rounded-full">Open</span>
                                                        :
                                                        <span className="text-[10px] uppercase font-bold text-gray-500">Booked</span>
                                                    }
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Booking Confirmation Dialog */}
                <Dialog open={isBookingDetailsOpen} onOpenChange={setIsBookingDetailsOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                Confirm Booking 🐊
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                You are about to book a slot for <strong>{sport}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-4 bg-gray-50 rounded-lg p-4 mt-2 border">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Court</span>
                                <span className="font-bold text-gray-900 text-lg">{selectedCourt?.CourtName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Time</span>
                                <span className="font-bold text-[#005B8D] text-lg bg-blue-50 px-3 py-1 rounded-md">
                                    {selectedSlot !== null ? timeSlotsLabels[selectedSlot] : ''}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <span className="text-gray-500 font-medium">Total Price</span>
                                <span className="font-bold text-green-600 text-lg">Free (Student)</span>
                            </div>
                        </div>
                        <DialogFooter className="mt-4 gap-2">
                            <Button variant="outline" onClick={() => setIsBookingDetailsOpen(false)} className="h-11">Cancel</Button>
                            <Button onClick={confirmBooking} disabled={bookingLoading} className="h-11 bg-[#FA4616] hover:bg-[#d13a10] text-white font-bold px-6">
                                {bookingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Booking"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function CourtsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CourtsContent />
        </Suspense>
    )
}
