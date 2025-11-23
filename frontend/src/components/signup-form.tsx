"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Mail,
  Lock,
  User,
  UserPlus,
  Phone,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
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

// 📝 VALIDATION
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z
    .string()
    .min(8, { message: "Phone number must be at least 8 digits." })
    .regex(/^[0-9]+$/, { message: "Phone number must contain only digits." }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
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

  // ===================================================================
  // 🌟 Floating Label Component
  // ===================================================================
  const FloatingLabel = ({
    htmlFor,
    label,
  }: {
    htmlFor: string;
    label: string;
  }) => (
    <FormLabel
      htmlFor={htmlFor}
      className="
        absolute left-10 px-1 bg-card z-10 
        text-muted-foreground pointer-events-none

        transition-all duration-300 ease-out
        -translate-y-4 scale-75 top-2 opacity-70

        peer-placeholder-shown:top-1/2
        peer-placeholder-shown:-translate-y-1/2
        peer-placeholder-shown:scale-100
        peer-placeholder-shown:opacity-100

        peer-focus:top-2
        peer-focus:-translate-y-4
        peer-focus:scale-75
        peer-focus:opacity-80
      "
    >
      {label}
    </FormLabel>
  );

  // ===================================================================
  // 🔥 SUBMIT HANDLER
  // ===================================================================
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
      });

      setTimeout(() => router.push("/login"), 1200);
    } catch (error: any) {
      toast.error("Signup Failed ❌", {
        description: error.message,
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

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder=" "
                      autoComplete="name"
                      {...field}
                      className="
                        pl-12 text-sm peer
                        transition-all duration-300
                        focus:ring-2 focus:ring-lime-300/50
                      "
                    />
                    <FloatingLabel htmlFor="name" label="Name" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder=" "
                      autoComplete="email"
                      {...field}
                      className="
                        pl-12 text-sm peer
                        transition-all duration-300
                        focus:ring-2 focus:ring-lime-300/50
                      "
                    />
                    <FloatingLabel htmlFor="email" label="Email" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PHONE */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder=" "
                      autoComplete="tel"
                      {...field}
                      className="
                        pl-12 text-sm peer
                        transition-all duration-300
                        focus:ring-2 focus:ring-lime-300/50
                      "
                    />
                    <FloatingLabel htmlFor="phone" label="Phone Number" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PASSWORD */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=" "
                      autoComplete="new-password"
                      {...field}
                      className="
                        pl-12 pr-10 text-sm peer
                        transition-all duration-300
                        focus:ring-2 focus:ring-lime-300/50
                      "
                    />
                    <FloatingLabel htmlFor="password" label="Password" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 8 characters.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full py-5 text-lg flex justify-center items-center"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5 text-lime-300" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center text-sm">
        <span className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Login
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
