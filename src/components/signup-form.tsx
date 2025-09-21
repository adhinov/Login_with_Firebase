
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Lock, User, UserPlus, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof formSchema>;

export function SignupForm() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: SignupFormValues) {
    // In a real app, you would handle user registration here.
    // For example, call an API endpoint.
    console.log(data);
    toast({
      title: "Account Created",
      description: `Welcome, ${data.name}! Your account has been successfully created.`,
    });
    // form.reset();
    // Potentially redirect user: router.push('/dashboard')
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Enter your details to create a new account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="name"
                          {...field}
                          className="pl-10 text-base peer"
                          placeholder=" "
                        />
                        <FormLabel
                          htmlFor="name"
                          className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-10 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                        >
                          Name
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <FormControl>
                       <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="email"
                          id="email"
                          {...field}
                          className="pl-10 text-base peer"
                          placeholder=" "
                        />
                        <FormLabel
                          htmlFor="email"
                          className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-10 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
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
                          id="password"
                          {...field}
                          className="pl-10 pr-10 text-base peer"
                          placeholder=" "
                        />
                         <FormLabel
                          htmlFor="password"
                          className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-10 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                        >
                          Password
                        </FormLabel>
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
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
             <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          {...field}
                          className="pl-10 pr-10 text-base peer"
                          placeholder=" "
                        />
                        <FormLabel
                          htmlFor="confirmPassword"
                          className="absolute text-base text-muted-foreground duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 left-10 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                        >
                          Confirm Password
                        </FormLabel>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                  <FormDescription className="text-xs">
                    Password must be at least 8 characters.
                  </FormDescription>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" className="p-0 h-auto text-primary" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
