"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:8080/AdminLogin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                throw new Error("Invalid credentials");
            }

            // Simple "auth" for now (In real app, use JWT)
            localStorage.setItem("adminAuthenticated", "true");
            toast.success("Welcome back, Admin!");
            router.push("/dashboard/admin");

        } catch (error) {
            toast.error("Login Failed", { description: "Invalid username or password" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4 text-4xl">🔐</div>
                    <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
                    <CardDescription className="text-center text-gray-400">
                        Enter your secure credentials
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Access Dashboard"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
