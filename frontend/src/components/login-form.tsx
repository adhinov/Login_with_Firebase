"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Lock, LogIn, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

// ✅ Validasi form
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // ✅ Fungsi login
  async function login(email: string, password: string) {
    if (!API_URL) {
      throw new Error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
    }

    const url = `${API_URL.replace(/\/$/, "")}/api/auth/login`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Login failed");
    }

    if (!result.user || !result.token) {
      throw new Error("Invalid response from server.");
    }

    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));

    return result;
  }

  // ✅ Submit handler
  async function onSubmit(data: LoginFormValues) {
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(data.email, data.password);

      toast.success(`Selamat datang, ${result.user?.username || "User"} 🎉`, {
        description: "Login berhasil! Anda akan diarahkan ke halaman utama.",
        duration: 2500,
      });

      setTimeout(() => {
        if (result.user?.role === "admin") {
          router.push("/adminDashboard");
        } else {
          router.push("/welcome");
        }
      }, 1800);
    } catch (error: any) {
      setErrorMessage(error?.message ?? "Login failed");
      toast.error("Login gagal ❌", {
        description: error?.message ?? "Periksa kembali email dan password Anda.",
        duration: 2500,
      });
    } finally {
      setLoading(false);
      form.resetField("password");
    }
  }

  return (
    <Card className="w-full max-w-[20rem] shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-lime-300">
          Login
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder=" "
                      {...field}
                      className="pl-12 text-sm peer"
                    />
                    <FormLabel
                      htmlFor="email"
                      className="absolute text-sm text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 
                      peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                      peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                    >
                      Email
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder=" "
                      {...field}
                      className="pl-12 pr-10 text-sm peer"
                    />
                    <FormLabel
                      htmlFor="password"
                      className="absolute text-sm text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 
                      peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                      peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                    >
                      Password
                    </FormLabel>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-xs">
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button
                variant="link"
                size="sm"
                className="px-0 text-xs h-auto"
                asChild
              >
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full text-lg py-6 mt-6 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-lime-300" />
                  Processing...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Submit
                </>
              )}
            </Button>

            {errorMessage && (
              <p
                className="text-red-500 text-sm text-center mt-2"
                aria-live="polite"
              >
                {errorMessage}
              </p>
            )}
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col items-center text-sm">
        <p className="text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Button variant="link" className="p-0 h-auto text-primary" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
