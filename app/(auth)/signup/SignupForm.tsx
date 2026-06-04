"use client";

import { signupStyles } from "@/app/assets/styles";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useSignup } from "@/app/hooks/useSignup";
import { Spinner } from "../../components/spinner";

const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(3, "Name must be at least 3 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords must match",
      });
    }
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const signupMutation = useSignup();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const confirmPassword = useWatch({
    control,
    name: "confirmPassword",
    defaultValue: "",
  });
  const passwordChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrengthLabel =
    passwordScore === 4 ? "Strong" : passwordScore >= 2 ? "Moderate" : "Weak";

  const onValidSubmit = async (values: SignupFormValues) => {
    try {
      const response = await signupMutation.mutateAsync(values);

      if (response.status === "success") {
        sessionStorage.setItem("verificationEmail", values.email.trim());
        toast.success("Verify your email to continue.");
        reset();
        router.replace("/verify-email");
        return;
      }

      toast.error(response.message ?? "Signup failed. Please try again.");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Unable to create account. Please try again.";
      toast.error(message);
    }
  };

  const onInvalidSubmit = () => {
    toast.error("Please fix the highlighted fields and try again.");
  };

  return (
    <div className={signupStyles.pageContainer}>
      <div className={signupStyles.cardContainer}>
        <div className={signupStyles.header}>
          <button
            className={signupStyles.backButton}
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className={signupStyles.avatar}>
            <User className="size-10 text-white" />
          </div>
          <h1 className={signupStyles.headerTitle}>Create Account</h1>
          <p className={signupStyles.headerSubtitle}>
            Join ExpenseTracker today and start managing your finances
            efficiently.
          </p>
        </div>
        <div className={signupStyles.formContainer}>
          <form
            onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
            autoComplete="off"
            noValidate
          >
            <div className="mb-6">
              <label htmlFor="name" className={signupStyles.label}>
                Full Name
              </label>
              <div className={signupStyles.inputContainer}>
                <div className={signupStyles.inputIcon}>
                  <User className="size-5" />
                </div>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={`${signupStyles.input} text-black placeholder:text-gray-400 focus:outline-0 ${
                    errors.name ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p id="name-error" className={signupStyles.fieldError}>
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="mb-6">
              <label htmlFor="email" className={signupStyles.label}>
                Email Address
              </label>
              <div className={signupStyles.inputContainer}>
                <div className={signupStyles.inputIcon}>
                  <Mail className="size-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`${signupStyles.input} text-black placeholder:text-gray-400 focus:outline-0 ${
                    errors.email ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="john@expensetracker.com"
                />
              </div>
              {errors.email && (
                <p id="email-error" className={signupStyles.fieldError}>
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="mb-6">
              <label htmlFor="password" className={signupStyles.label}>
                Password
              </label>
              <div className={signupStyles.inputContainer}>
                <div className={signupStyles.inputIcon}>
                  <Lock className="size-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register("password")}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={`${signupStyles.passwordInput} text-black placeholder:text-gray-400 focus:outline-0 ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={signupStyles.passwordToggle}
                >
                  {showPassword ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className={signupStyles.fieldError}>
                  {errors.password.message}
                </p>
              )}
              {password.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Password strength</span>
                    <span
                      className={
                        passwordScore === 4
                          ? "text-emerald-600"
                          : passwordScore >= 2
                            ? "text-amber-600"
                            : "text-red-500"
                      }
                    >
                      {passwordStrengthLabel}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={
                        passwordScore === 4
                          ? "h-full w-full bg-emerald-500"
                          : passwordScore === 3
                            ? "h-full w-3/4 bg-emerald-400"
                            : passwordScore === 2
                              ? "h-full w-1/2 bg-amber-500"
                              : passwordScore === 1
                                ? "h-full w-1/4 bg-red-500"
                                : "h-full w-0 bg-gray-200"
                      }
                    />
                  </div>
                </div>
              )}
              {password.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li
                    className={
                      passwordChecks.length
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      passwordChecks.lowercase
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      passwordChecks.uppercase
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      passwordChecks.special
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }
                  >
                    One special character
                  </li>
                </ul>
              )}
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className={signupStyles.label}>
                Confirm Password
              </label>
              <div className={signupStyles.inputContainer}>
                <div className={signupStyles.inputIcon}>
                  <Lock className="size-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  {...register("confirmPassword")}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  className={`${signupStyles.passwordInput} text-black placeholder:text-gray-400 focus:outline-0 ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={signupStyles.passwordToggle}
                >
                  {showConfirmPassword ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className={signupStyles.fieldError}
                >
                  {errors.confirmPassword.message}
                </p>
              )}
              {!errors.confirmPassword && confirmPassword.length > 0 && (
                <p
                  className={
                    confirmPassword === password
                      ? "mt-1 text-xs text-emerald-600"
                      : "mt-1 text-xs text-red-500"
                  }
                >
                  {confirmPassword === password
                    ? "Passwords match"
                    : "Passwords should match"}
                </p>
              )}
            </div>
            <button
              type="submit"
              className={`${signupStyles.button} hover:scale-105 transition-transform ease-in-out duration-300 ${isSubmitting ? signupStyles.buttonDisabled : ""}`}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-5 w-5 mr-2 text-gray-300 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          <div className={signupStyles.signInContainer}>
            <p className={signupStyles.signInText}>
              Already have an account?{" "}
              <Link href="/login" className={signupStyles.signInLink}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
