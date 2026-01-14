import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { api } from "@/app/lib/api";
import { useRouter} from "next/navigation"
interface CardDemoProps {
  onClose?: () => void;
}

export function CardDemo({ onClose }: CardDemoProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      // Use name as Name, description as Config (according to api signature)
      const create = await api.workflows.create(name, []);
      // Optionally: do something with create.data, e.g. inform user or fetch further data
      const id = create.data.Data.id;

      router.push(`/workflows/${id}`);
      if (onClose) onClose();
    } catch (error: any) {
      setLoading(false);
      if (error?.response?.data?.message) {
        setError(error.response.data.message);
      } else if (typeof error === "string") {
        setError(error);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-sm z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Create Workflow</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            id="create-workflow-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name of workflow"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workflow-desc">Description (optional)</Label>
              <Input
                id="workflow-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Workflow description (optional)"
                disabled={loading}
              />
            </div>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </form>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            form="create-workflow-form"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Submit"}
          </Button>
        </CardFooter>

        <button
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 transition rounded-sm z-20"
          onClick={onClose}
          disabled={loading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 6L6 18M6 6l12 12"
            />
          </svg>
        </button>
      </Card>
    </div>
  );
}
