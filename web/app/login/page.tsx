"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError("");

        try {
            await signIn({ username: values.email, password: values.password });

            // On successful login, check if Admin
            if (values.email.toLowerCase().includes("admin")) { // Simple check, or rely on specific response
                // Ideally we check groups or attributes, but for now:
                if (values.email === "admin@courtlink.com") { // Example
                    localStorage.setItem("adminAuthenticated", "true");
                    router.push("/dashboard/admin");
                    return;
                }
            }
            router.push("/dashboard");

        } catch (err: any) {
            console.error("Login error:", err);

            // Check if user is already signed in
            if (err.name === "UserAlreadyAuthenticatedException" || err.message?.includes("already a signed in user")) {
                try {
                    await signOut();
                    // Retry login once
                    await signIn({ username: values.email, password: values.password });
                    router.push("/dashboard");
                    return;
                } catch (retryErr) {
                    setError("Session mismatch. Please refresh and try again.");
                }
            } else {
                setError(err.message || "Failed to sign in");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gator-gradient p-4">
            <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <span className="text-4xl">🐊</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-center text-[#005B8D]">UFCourtLink</CardTitle>
                    <CardDescription className="text-center text-gray-500 font-medium">
                        Secure Your Spot. Play Hard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="gator@ufl.edu" {...field} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100 text-center">{error}</div>}
                            <Button type="submit" className="w-full bg-[#005B8D] hover:bg-[#004b75] text-white font-bold h-11 transition-all" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In to CourtLink"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center pb-8">
                    <p className="text-sm text-gray-500">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-[#FA4616] font-semibold hover:underline">
                            Create an account
                        </Link>
                    </p>
                    <div className="text-xs text-gray-400">
                        © 2024 University of Florida CourtLink
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
