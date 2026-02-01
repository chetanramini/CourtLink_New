"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { confirmSignUp } from "aws-amplify/auth";
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
    code: z.string().min(6, "Code must be at least 6 characters"),
});

function ConfirmForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultEmail = searchParams.get("email") || "";

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: defaultEmail,
            code: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError("");
        try {
            await confirmSignUp({
                username: values.email,
                confirmationCode: values.code,
            });
            setSuccess(true);
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to confirm account");
        } finally {
            setIsLoading(false);
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h3 className="text-2xl font-bold text-[#005B8D]">Ready to Chomp!</h3>
                        <p className="text-gray-600">Account verified successfully.</p>
                        <p className="text-sm text-gray-400">Redirecting to login...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                    <span className="text-4xl">🐊</span>
                </div>
                <CardTitle className="text-3xl font-bold text-center text-[#005B8D]">Verify Account</CardTitle>
                <CardDescription className="text-center text-gray-500 font-medium">
                    Enter the code sent to your email
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
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700">Confirmation Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123456" {...field} className="bg-gray-50 border-gray-200 focus:ring-[#FA4616] focus:border-[#FA4616] text-center tracking-widest text-lg" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100 text-center">{error}</div>}
                        <Button type="submit" className="w-full bg-[#005B8D] hover:bg-[#004b75] text-white font-bold h-11 transition-all" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Log In"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function ConfirmPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gator-gradient p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ConfirmForm />
            </Suspense>
        </div>
    )
}
