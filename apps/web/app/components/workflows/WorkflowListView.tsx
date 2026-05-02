"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import ParentComponent from "@/app/components/ui/Design/WorkflowButton";
import { api } from "@/app/lib/api";

interface WorkflowListViewProps {
  title?: string;
  showTitle?: boolean;
  showCreateButton?: boolean;
}

export default function WorkflowListView({
  title = "User Workflows",
  showTitle = true,
  showCreateButton = true,
}: WorkflowListViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.user.get();
        const workflows = response.data.Data || response.data || [];
        setData(Array.isArray(workflows) ? workflows : []);
      } catch (fetchError) {
        setError("Failed to fetch workflows");
        console.error("Failed to fetch workflows:", fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  return (
    <div>
      {showTitle && <h2 className="text-xl font-bold mb-4 text-[#f0f0e8]">{title}</h2>}
      {loading ? (
        <div className="text-[#6a7560]">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-[#5a6350]">No workflows found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-8 place-items-center sm:grid-cols-2 md:grid-cols-3">
          {data.map((workflow: any) => (
            <Card
              key={workflow.id || workflow.Name}
              className="w-64 h-64 flex flex-col justify-between items-stretch rounded-xl shadow-md bg-[#111611] border-[#2a3525]/60"
              style={{
                aspectRatio: "1 / 1",
                maxWidth: "16rem",
                maxHeight: "16rem",
                minWidth: "16rem",
                minHeight: "16rem",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <CardHeader className="pb-2 pt-3 text-center">
                <CardTitle className="truncate text-[#e8e8d8]">
                  {workflow.name || workflow.Name || "Untitled Workflow"}
                </CardTitle>
                {workflow.description && (
                  <CardDescription className="text-xs mt-2 truncate text-[#6a7560]">
                    {workflow.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-2">
                <pre className="text-xs whitespace-pre-wrap break-words leading-tight font-mono px-4 text-[#8a9178]">
                  {(() => {
                    const config = workflow.config ?? workflow.Config;
                    if (
                      config == null ||
                      (typeof config === "object" &&
                        !Array.isArray(config) &&
                        Object.keys(config).length === 0) ||
                      (Array.isArray(config) && config.length === 0)
                    ) {
                      return "Not Configured";
                    }
                    return JSON.stringify(config, null, 2);
                  })()}
                </pre>
              </CardContent>
              <CardFooter className="pb-3 pt-2 flex flex-col">
                <Button
                  variant="outline"
                  className="w-full hover:cursor-pointer border-[#2a3525] text-[#c8d4a8] hover:bg-[#1a2118] hover:text-[#baf266] hover:border-[#baf266]/30"
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

      {showCreateButton && (
        <div className="fixed bottom-0 left-0 w-full flex justify-end p-6 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <ParentComponent />
          </div>
        </div>
      )}
    </div>
  );
}
