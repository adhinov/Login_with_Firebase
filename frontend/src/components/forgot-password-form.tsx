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
import { Mail, Loader2 } from "lucide-react";

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
          "Email reset password berhasil dikirim. Silahkan cek inbox email anda."
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
      <Card className="w-full max-w-[350px] shadow-xl border border-gray-700 bg-[#111827]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-lime-400">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center text-gray-400 text-xs">
            Enter your email to receive a reset link.
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
                      <div className="relative">
                        {/* Input */}
                        <Input
                          id="email"
                          type="email"
                          placeholder=" "
                          {...field}
                          disabled={loading}
                          className="peer w-full pl-9 pr-3 py-2.5 bg-transparent border-b border-gray-600 text-white focus:outline-none focus:border-lime-400 text-sm transition-colors duration-300"
                        />

                        {/* Ikon */}
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 peer-focus:text-lime-400 transition-colors duration-300" />

                        {/* Label mengambang */}
                        <label
                          htmlFor="email"
                          className="absolute left-9 top-2.5 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-lime-400 bg-[#111827] px-1"
                        >
                          Email
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tombol submit */}
              <Button
                type="submit"
                className="w-full text-sm py-2.5 mt-4 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-lime-300" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex-col items-center text-xs text-gray-400">
          <p className="mt-2">
            Back to{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-400 hover:underline text-xs"
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
