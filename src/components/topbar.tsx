import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function Topbar({ title }: { title: string }) {
  const session = await auth();
  return (
    <header className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
      </div>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
        <Button variant="outline" size="sm">Logout</Button>
      </form>
    </header>
  );
}
