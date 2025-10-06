"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Lock, User, UserPlus, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ✅ Validasi form
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z
    .string()
    .min(8, { message: "Phone number must be at least 8 digits." })
    .regex(/^[0-9]+$/, { message: "Phone number must contain only digits." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

type SignupFormValues = z.infer<typeof formSchema>;

export default function SignupForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.name,
          email: data.email,
          phone_number: data.phone,
          password: data.password,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Signup failed");

      toast.success("Registration Successful 🎉", {
        description: "Your account has been created. Please log in.",
        duration: 4200,
      });

      setTimeout(() => router.push("/login"), 1500);
    } catch (error: any) {
      toast.error("Signup Failed ❌", {
        description: error.message || "An error occurred during signup.",
        duration: 4200,
      });
    }
  }

  return (
    <Card className="w-full max-w-xs shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-lime-300">
          Create Account
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Enter your details to create a new account.
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="name"
                      required
                      autoComplete="name"
                      {...field}
                      className="pl-12 text-sm peer"
                      placeholder=" "
                    />
                    <FormLabel
                      htmlFor="name"
                      className="absolute text-sm text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 
                      peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                      peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                    >
                      Name
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
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
                      required
                      autoComplete="email"
                      {...field}
                      className="pl-12 text-sm peer"
                      placeholder=" "
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

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      {...field}
                      className="pl-12 text-sm peer"
                      placeholder=" "
                    />
                    <FormLabel
                      htmlFor="phone"
                      className="absolute text-sm text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 
                      peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                      peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                    >
                      Phone Number
                    </FormLabel>
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
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      {...field}
                      className="pl-12 pr-10 text-sm peer"
                      placeholder=" "
                    />
                    <FormLabel
                      htmlFor="password"
                      className="absolute text-sm text-muted-foreground transform -translate-y-4 scale-75 top-2 z-10 bg-card px-2 left-9 
                      peer-placeholder-shown:scale-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                      peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4"
                    >
                      Password
                    </FormLabel>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 8 characters.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full text-lg py-6 flex items-center justify-center"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-lime-300" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col items-center text-sm">
        <p className="text-muted-foreground mt-4">
          Already have an account?{" "}
          <Button variant="link" className="p-0 h-auto text-primary" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
