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
            <Card className="w-[400px] shadow-lg">
                <CardContent className="pt-6">
                    <div className="text-center text-green-600 space-y-2">
                        <h3 className="text-xl font-bold">Account Confirmed!</h3>
                        <p>Redirecting to login...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-[400px] shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Verify Account</CardTitle>
                <CardDescription className="text-center">
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
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="m@example.com" {...field} />
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
                                    <FormLabel>Confirmation Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123456" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Account"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function ConfirmPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Suspense fallback={<div>Loading...</div>}>
                <ConfirmForm />
            </Suspense>
        </div>
    )
}
