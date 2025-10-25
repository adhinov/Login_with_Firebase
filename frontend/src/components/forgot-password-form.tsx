"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Loader2, Send, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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

// ✅ Validasi Email
const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false); // ⬅️ state untuk "Link Sent!"

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  // ======================== HANDLE SUBMIT ========================
  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      setLoading(true);
      setSent(false);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { email: values.email }
      );

      toast.success("📩 Link reset password sudah dikirim!", {
        description: "Silakan cek inbox atau folder spam email kamu.",
        duration: 4000,
      });

      // ✅ Kosongkan field email setelah sukses
      form.reset({ email: "" });

      // ✅ Ubah tombol jadi "Link Sent!" selama 10 detik
      setSent(true);
      setTimeout(() => setSent(false), 10000);

    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error("Gagal mengirim link reset ❌", {
        description:
          error.response?.data?.message ||
          "Terjadi kesalahan, coba lagi nanti.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ======================== RENDER UI ========================
  return (
    <Card className="w-full max-w-[20rem] shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-lime-300">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Enter your Email to receive reset password via email inbox
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
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
                      placeholder=" "
                      required
                      autoComplete="email"
                      {...field}
                      disabled={loading || sent}
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

            {/* Tombol Submit */}
            <Button
              type="submit"
              className="w-full text-lg py-6 mt-6 flex items-center justify-center"
              disabled={loading || sent}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-lime-300" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5 text-lime-300" />
                  Link Sent!
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send Reset Link
                </>
              )}
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
  );
}
