"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Lock, KeyRound } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast, Toaster } from "sonner"; // ✅ tambahkan ini
import { useState } from "react";
import Link from "next/link";

// ✅ Skema validasi form
const formSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof formSchema>;

// ✅ Props untuk menerima token dari page.tsx
interface ResetPasswordProps {
  token: string;
}

export default function ResetPassword({ token }: ResetPasswordProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // ✅ Fungsi submit
  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
        { password: values.password }
      );

      toast.success(res.data.message || "Password reset successful!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to reset password. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      {/* ✅ Tambahkan Toaster di sini */}
      <Toaster richColors position="top-center" />

      <Card className="w-full max-w-xs shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-lime-300">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-xs">
            Set your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            type="password"
                            placeholder=" "
                            {...field}
                            className="pl-12 text-base peer"
                          />
                          <FormLabel className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-9 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                            New Password
                          </FormLabel>
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder=" "
                            {...field}
                            className="pl-12 text-base peer"
                          />
                          <FormLabel className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-9 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                            Confirm Password
                          </FormLabel>
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full py-6"
                disabled={loading || form.formState.isSubmitting}
              >
                {loading ? "Processing..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex-col items-center text-sm">
          <p className="text-muted-foreground mt-4">
            Back to{" "}
            <Button variant="link" className="p-0 h-auto text-primary" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
