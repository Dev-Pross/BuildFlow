import { getServerSession } from "next-auth";
import { AuthOptions } from "@/app/api/auth/utils/auth";
import ParentComponent from "./components/ui/Design/WorkflowButton";

export default async function Home() {
  const session = await getServerSession(AuthOptions);
  return (
    <div>
      <div className="text-4xl">
        Hello world
      </div>
      <div className="text-6xl">
        Hello world
        <p>{JSON.stringify(session?.user)}</p>
        {session ? (
          <>
            <p>Status: Authenticated</p>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 mt-4 bg-red-500 text-white rounded"
              >
                Log out
              </button>

            </form>
            <br />
            <ParentComponent/>

          </>
        ) : (
          <>
            <p>Status: Not authenticated</p>
            <form action="/login" method="post">
              <button
                type="submit"
                className="px-4 py-2 mt-4 bg-green-500 text-white rounded"
              >
                Sign in
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}