"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Loader2, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
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

// ✅ Validasi
const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [loading, setLoading] = React.useState(false);

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
          "Email reset password berhasil dikirim. Silakan cek inbox Anda."
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
    <Card className="w-full max-w-[20rem] shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-lime-300">
          Forgot Password
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-lime-300" />
                  Sending...
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
