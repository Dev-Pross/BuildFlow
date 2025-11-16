// packages/trpc/src/index.ts
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

// Create a public procedure that returns a greeting
export const appRouter = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello, ${input.name || 'world'}!`;
    }),
});

// Export the AppRouter type for client-side usage
// export type AppRouter = typeof appRouter;
