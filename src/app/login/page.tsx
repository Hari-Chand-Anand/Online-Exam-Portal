import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="gradient-shell flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md bg-white/90 shadow-xl backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 rounded-2xl bg-slate-950 p-3 text-white"><GraduationCap className="h-7 w-7" /></div>
          <CardTitle className="text-2xl">HCA Exam Portal</CardTitle>
          <CardDescription>Login with your approved Google account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/candidate/dashboard" }); }}>
            <Button className="w-full" size="lg">Continue with Google</Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">Admin users are redirected to admin console after login.</p>
        </CardContent>
      </Card>
    </main>
  );
}
