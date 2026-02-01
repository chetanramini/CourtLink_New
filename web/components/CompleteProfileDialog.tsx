"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchUserAttributes, signOut } from "aws-amplify/auth";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    ufid: z.string().min(8, "UFID must be 8 digits").max(8, "UFID must be 8 digits").regex(/^\d+$/, "UFID must be numbers only"),
});

export default function CompleteProfileDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            ufid: "",
        },
    });

    useEffect(() => {
        checkProfileStatus();
    }, []);

    const checkProfileStatus = async () => {
        // Skip for Admin
        if (typeof window !== "undefined" && window.location.pathname.includes("/admin")) return;
        if (typeof window !== "undefined" && localStorage.getItem("adminAuthenticated") === "true") return;

        try {
            const user = await fetchUserAttributes();
            if (!user.email) return;

            setEmail(user.email);

            // Check if backend has this user's UFID
            const res = await fetch(`http://localhost:8080/GetCustomer?email=${user.email}`);

            if (res.ok) {
                const data = await res.json();

                // If backend says "Gator User", we MUST prompt them, regardless of what local storage thinks.
                if (data.name === "Gator User" || !data.ufid || data.ufid === "N/A") {
                    setIsOpen(true);
                    return;
                }

                if (data.ufid && data.name && data.name !== "Gator User") {
                    // Profile exists! Sync to local storage and SKIP dialog
                    localStorage.setItem("userProfileCompleted", "true");
                    localStorage.setItem("userName", data.name);
                    localStorage.setItem("userUFID", data.ufid);
                    return; // EXIT
                }
            }

            // Fallback: If fetch failed (e.g. 404 system wipe), we MUST show validation dialog
            // so they can restore their profile in the DB.
            setIsOpen(true);
        } catch (e) {
            console.error("Auth check failed", e);
        }
    };

    async function onSubmit(values: z.infer<typeof profileSchema>) {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:8080/Customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    name: values.name,
                    ufid: values.ufid,
                }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            toast.success("Profile Updated!");
            localStorage.setItem("userProfileCompleted", "true");
            localStorage.setItem("userName", values.name);
            localStorage.setItem("userUFID", values.ufid);
            setIsOpen(false);

            // Force reload to update Navbar
            window.location.reload();

        } catch (error) {
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            {/* preventClosing by empty handler if you want to force it */}
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Profile 🐊</DialogTitle>
                    <DialogDescription>
                        To ensure access to courts, we need your full name and UFID.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Alberta Gator" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ufid"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UFID (8 Digits)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12345678" {...field} maxLength={8} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="flex-col sm:flex-col gap-2">
                            <Button type="submit" disabled={isLoading} className="w-full bg-[#FA4616] hover:bg-[#d13a10]">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save & Continue"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={async () => {
                                    const { signOut } = await import("aws-amplify/auth");
                                    await signOut();
                                    localStorage.clear();
                                    window.location.href = "/login";
                                }}
                            >
                                Sign Out
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
