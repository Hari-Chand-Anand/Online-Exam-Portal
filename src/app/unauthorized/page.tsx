import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">You are not authorized for this exam</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Use the same Gmail account that was invited by the admin. If you believe this is a mistake, contact the hiring team.</p>
      <Button asChild className="mt-6"><Link href="/login">Back to login</Link></Button>
    </main>
  );
}
