"use client"
import { useEffect, useState } from "react";
import { useAppSelector } from "../hooks/redux";
import { api } from "../lib/api";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation";
// Removed: import { Router } from "next/router";

export const UserWorkflows = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const userId = useAppSelector((select) => select.user.userId) as string;
    const router = useRouter(); // FIX: Call useRouter as a hook to get the router instance

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.user.get();
                const workflows = response.data.Data || response.data || [];
                setData(Array.isArray(workflows) ? workflows : []);
                console.log("The workflow data is", workflows);
            } catch (error) {
                setError("Failed to fetch workflows");
                console.error("Failed to fetch workflows:", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchWorkflows();
        }
    }, [userId]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">User Workflows</h2>
            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : data.length === 0 ? (
                <div>No workflows found.</div>
            ) : (
                // Center and grid the square cards
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 place-items-center">
                    {data.map((workflow: any) => (
                        <Card
                            key={workflow.id || workflow.Name}
                            className="w-64 h-64 flex flex-col justify-between items-stretch rounded-xl shadow-md bg-background"
                            style={{
                                aspectRatio: '1 / 1',
                                maxWidth: '16rem',
                                maxHeight: '16rem',
                                minWidth: '16rem',
                                minHeight: '16rem',
                                marginLeft: 'auto',
                                marginRight: 'auto'
                            }}
                        >
                            <CardHeader className="pb-2 pt-3 text-center">
                                <CardTitle className="truncate">{workflow.name || workflow.Name || "Untitled Workflow"}</CardTitle>
                                {workflow.description && (
                                    <CardDescription className="text-xs mt-2 truncate">{workflow.description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-2">
                                <pre className="text-xs whitespace-pre-wrap break-words leading-tight font-mono">
                                    {JSON.stringify(workflow.config || workflow.Config, null, 2)}
                                </pre>
                            </CardContent>
                            <CardFooter className="pb-3 pt-2 flex flex-col">
                                <Button
                                    variant="outline"
                                    className="w-full hover:cursor-pointer"
                                    onClick={() => {
                                        router.push(`/workflows/${workflow.id}`);
                                    }}
                                >
                                    Open
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserWorkflows