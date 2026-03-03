"use client";

/**
 * Page for logging in.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Activity, Moon, Sun, AlertCircle } from "lucide-react";
import { useApp } from "@/app/AppProvider";
import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";

export default function LoginPage() {
    const router = useRouter();
    const { theme, setCurrentProject, toggleTheme } = useApp();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Ensure there's no selected project while on the login page.
    useEffect(() => {
        setCurrentProject(null);
    }, [setCurrentProject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password) return;
        setIsLoading(true);
        try {
            await login({ username: username.trim(), password });
            router.push("/projects");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors">
            {/* Theme Toggle */}
            <Button
                onClick={toggleTheme}
                variant="secondary"
                size="icon"
                className="absolute top-6 right-6"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {theme === "dark" ? <Sun /> : <Moon />}
            </Button>

            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
                        <Activity className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">GLaDOS</h1>
                    <p className="text-muted-foreground">AI Anomaly Detection System</p>
                </div>

                {/* Login Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Technician Login</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form onSubmit={handleSubmit}>
                            <FormField>
                                <FormItem>
                                    <FormLabel htmlFor="username">Username</FormLabel>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                        <Input
                                            type="text"
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10"
                                            placeholder="Enter username"
                                            required
                                        />
                                    </div>
                                </FormItem>
                            </FormField>

                            <FormField>
                                <FormItem>
                                    <FormLabel htmlFor="password">Password</FormLabel>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                        <Input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10"
                                            placeholder="Enter password"
                                            required
                                        />
                                    </div>
                                </FormItem>
                            </FormField>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm mb-4">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex-col">
                        <div className="w-full pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                                Demo credentials: username <code>test</code>, password <code>test</code>
                            </p>
                        </div>
                    </CardFooter>
                </Card>

                <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        Manufacturing Quality Assurance Platform v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
