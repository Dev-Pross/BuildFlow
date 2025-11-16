// apps/web/src/app/page.tsx
'use client';
import { trpc } from './utils/trpc';

export default function Home() {
  // Fix: Use a valid tRPC query (replace 'greeting' with existing query or handle error gracefully)
  // Use the valid 'greeting' query instead of 'hello'
  const { data, isLoading, error } = trpc.greeting.useQuery({ name: 'tRPC' });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data found.</div>;

  return <h1>{data}</h1>;
}
