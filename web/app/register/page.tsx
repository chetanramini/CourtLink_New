"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "aws-amplify/auth";
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
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email(),
    ufid: z.string().length(8, "UFID must be exactly 8 digits").regex(/^\d+$/, "UFID must be numbers only"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [needsConfirmation, setNeedsConfirmation] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            ufid: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError("");
        try {
            const { nextStep } = await signUp({
                username: values.email,
                password: values.password,
                options: {
                    userAttributes: {
                        name: values.name,
                        email: values.email,
                    },
                },
            });

            // Immediately create/update backend profile to avoid "Complete Profile" dialog later
            // We do this BEFORE confirmation so it's ready. If sign up fails, this might leave an orphan,
            // but effectively it's harmless as they can't login without confirming.
            await fetch("http://localhost:8080/Customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: values.email,
                    name: values.name,
                    ufid: values.ufid,
                }),
            });

            if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                setNeedsConfirmation(true);
                router.push(`/confirm?email=${encodeURIComponent(values.email)}`);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to register");
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
                    <CardTitle className="text-3xl font-bold text-center text-[#005B8D]">Join The Swamp</CardTitle>
                    <CardDescription className="text-center text-gray-500 font-medium">
                        Create your account to start booking courts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Alberta Gator" {...field} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                name="ufid"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">UFID (8 Digits)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12345678" {...field} maxLength={8} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616]" />
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
                                            <Input type="password" placeholder="••••••••" {...field} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100 text-center">{error}</div>}
                            <Button type="submit" className="w-full bg-[#FA4616] hover:bg-[#d13a10] text-white font-bold h-11 transition-all" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center pb-8">
                    <p className="text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#005B8D] font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
