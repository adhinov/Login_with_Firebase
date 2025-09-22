
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Send } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(data: ForgotPasswordFormValues) {
    console.log(data);
    toast({
      title: "Password Reset Link Sent",
      description: `If an account exists for ${data.email}, a password reset link has been sent.`,
    });
    form.reset();
  }

  return (
    <Card className="w-full max-w-xs shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center text-xs">
          Enter your email to receive a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                         <FormLabel
                          className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-9 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none"
                        >
                          Email
                        </FormLabel>
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full py-6" disabled={form.formState.isSubmitting}>
              <Send className="mr-2 h-5 w-5" /> Send Password Reset Link
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-center text-sm">
        <p className="text-muted-foreground">
          Remember your password?{' '}
          <Button variant="link" className="p-0 h-auto text-primary" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
