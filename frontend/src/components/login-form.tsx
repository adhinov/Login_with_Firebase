"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

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

// ✅ Schema validasi
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
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

  async function onSubmit(data: LoginFormValues) {
    setErrorMessage(null); // reset error tiap kali submit
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // ✅ tampilkan error di UI & toast
        const msg = result.message || "Email atau password salah.";
        setErrorMessage(msg);
        toast.error("Login gagal ❌", {
          description: msg,
          duration: 3000,
        });
        return;
      }

      // ✅ Simpan token, role, lastLogin di localStorage
      if (result.token) {
        localStorage.setItem("token", result.token);
      }
      if (result.user?.role) {
        localStorage.setItem("role", result.user.role);
      }
      if (result.user?.last_login) {
        // simpan last login (sebelumnya) ke localStorage
        localStorage.setItem("lastLogin", result.user.last_login);
      }

      // ✅ Toast sukses
      toast.success(`Welcome back, ${result.user.username || "User"}! 🎉`, {
        description: "Login berhasil.",
        duration: 3000,
      });

      // ✅ Redirect sesuai role
      if (result.user.role === "admin") {
        router.push("/adminDashboard");
      } else {
        router.push("/welcome");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi. Coba lagi.");
      toast.error("Login gagal ❌", {
        description: "Terjadi kesalahan koneksi. Coba lagi.",
        duration: 3000,
      });
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
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder=" "
                          {...field}
                          className="pl-12 text-base peer"
                        />
                        <FormLabel className="absolute text-base text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                          Email
                        </FormLabel>
                      </div>
                    </FormControl>
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
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder=" "
                          {...field}
                          className="pl-12 pr-10 text-base peer"
                        />
                        <FormLabel className="absolute text-base text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4">
                          Password
                        </FormLabel>
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
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
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-xs">
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button variant="link" size="sm" className="px-0 text-xs h-auto" asChild>
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full text-lg py-6 mt-6"
              disabled={form.formState.isSubmitting}
            >
              <LogIn className="mr-2 h-5 w-5" /> Submit
            </Button>

            {/* ✅ Error message global */}
            {errorMessage && (
              <p className="text-red-500 text-sm text-center mt-2">{errorMessage}</p>
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
