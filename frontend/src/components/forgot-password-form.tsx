"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { Mail, Send, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    const toastId = toast.loading("Mengirim email reset password...");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        data
      );

      toast.dismiss(toastId);
      toast.success(res.data.message || "Email terkirim! Silakan cek inbox Anda.");
      form.reset();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("❌ Forgot password error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan saat mengirim email reset password.";

      toast.error(errorMessage);
    }
  }

  return (
    <Card className="w-full max-w-xs shadow-xl bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-lime-300">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Masukkan email Anda untuk menerima tautan reset password.
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <FormLabel className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-9 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                          Email
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
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" /> Send Password Reset Link
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col items-center text-sm">
        <p className="text-muted-foreground mt-4">
          Remember your password?{" "}
          <Button variant="link" className="p-0 h-auto text-primary" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
