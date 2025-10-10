// components/forgot-password-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { toast } from "sonner";
import Link from "next/link";
import { Mail } from "lucide-react"; // ← pakai lucide-react (sudah di projectmu)

// Skema validasi email
const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { email: values.email }
      );

      toast.success(
        res.data.message ||
          "Email reset password berhasil dikirim. Silahkan cek inbox pada email anda."
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Gagal mengirim email reset password. Coba lagi nanti."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0b1120]">
      <Card className="w-full max-w-xs shadow-xl border border-gray-700 bg-[#111827]">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-lime-400">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center text-gray-400 text-xs">
            Enter your email address to receive a reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative flex items-center">
                        {/* ikon amplop */}
                        <Mail className="absolute left-2 text-gray-400 peer-focus:text-lime-400 transition-colors" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          disabled={loading}
                          className="peer pl-9 bg-transparent border-b-2 border-gray-600 text-white placeholder-transparent focus:outline-none focus:border-lime-400 transition-colors duration-300 w-full"
                          aria-label="Email"
                        />
                        <label
                          htmlFor="forgot-email"
                          className="absolute left-9 -top-3.5 text-gray-400 text-sm transition-all 
                            peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
                            peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-lime-400 peer-focus:text-sm pointer-events-none"
                        >
                          Email
                        </label>

                        {/* Animated underline */}
                        <div
                          className="absolute bottom-0 left-0 h-[2px] bg-lime-400 origin-left"
                          style={{
                            transform: field.value ? "scaleX(1)" : "scaleX(0)",
                            transformOrigin: "left",
                            transition: "transform 280ms ease",
                            width: "100%",
                          }}
                          aria-hidden
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                disabled={loading || form.formState.isSubmitting}
              >
                {loading ? "Processing..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex-col items-center text-sm text-gray-400">
          <p className="mt-2">
            Back to{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-400 hover:underline"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
