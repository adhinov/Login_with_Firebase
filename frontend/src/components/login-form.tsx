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

// 📝 Validasi dengan Zod
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

  // 🔐 LOGIN
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
    if (!response.ok) throw new Error(result.message || "Login failed");

    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));

    return result;
  }

  // 🚀 Submit handler
  async function onSubmit(data: LoginFormValues) {
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(data.email, data.password);
      const role = result.user?.role || "user";

      toast.success(`Welcome, ${result.user?.username} 🎉`, {
        duration: 2000,
      });

      setTimeout(() => {
        router.push(role === "admin" ? "/adminDashboard" : "/chat");
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message);
      toast.error("Login failed ❌", {
        description: error.message,
      });
    } finally {
      setLoading(false);
      form.resetField("password");
    }
  }

  // ===================================================================
  // 🌟  CUSTOM FLOATING LABEL COMPONENT
  // ===================================================================
  const FloatingLabel = ({
    htmlFor,
    label,
  }: {
    htmlFor: string;
    label: string;
  }) => (
    <FormLabel
      htmlFor={htmlFor}
      className="
        absolute left-10 px-1 bg-card z-10 
        text-muted-foreground pointer-events-none

        transition-all duration-300 ease-out
        -translate-y-4 scale-75 top-2 opacity-70

        peer-placeholder-shown:top-1/2
        peer-placeholder-shown:-translate-y-1/2
        peer-placeholder-shown:scale-100
        peer-placeholder-shown:opacity-100

        peer-focus:top-2
        peer-focus:-translate-y-4
        peer-focus:scale-75
        peer-focus:opacity-80
      "
    >
      {label}
    </FormLabel>
  );

  // ===================================================================
  // 🌟  UI LOGIN FORM
  // ===================================================================
  return (
    <Card className="w-full max-w-[20rem] shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-lime-300">
          Login
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      placeholder=" "
                      {...field}
                      className="
                        pl-12 text-sm peer
                        transition-all duration-300
                        focus:ring-2 focus:ring-lime-300/50
                      "
                    />

                    <FloatingLabel htmlFor="email" label="Email" />
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
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=" "
                      {...field}
                      className="
                        pl-12 pr-10 text-sm peer
                        transition-all duration-300
                        focus:ring-2 focus:ring-lime-300/50
                      "
                    />

                    <FloatingLabel htmlFor="password" label="Password" />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember Me + Forgot */}
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel className="text-xs">Remember me</FormLabel>
                  </FormItem>
                )}
              />

              <Link href="/forgot-password" className="text-xs text-primary">
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-5 text-lg flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin text-lime-300" />
                  Loading...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" /> Submit
                </>
              )}
            </Button>

            {errorMessage && (
              <p className="text-red-500 text-center text-sm mt-1">
                {errorMessage}
              </p>
            )}
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center text-sm">
        <span className="text-muted-foreground">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium">
            Sign up
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
