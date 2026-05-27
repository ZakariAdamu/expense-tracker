"use client";

import { loginStyles } from "@/app/assets/styles";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLogin } from "@/app/hooks/useLogin";
import { useAuth } from "@/app/context/AuthContext";
import { Spinner } from "@/app/components/spinner";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();
  const { setAuth } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const storedLocal = localStorage.getItem("signupPrefill");
    const storedSession = sessionStorage.getItem("signupPrefill");
    const stored = storedLocal ?? storedSession;
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        email?: string;
        password?: string;
      };
      reset({
        email: parsed.email ?? "",
        password: parsed.password ?? "",
      });
    } finally {
      localStorage.removeItem("signupPrefill");
      sessionStorage.removeItem("signupPrefill");
    }
  }, [reset]);

  const onValidSubmit = async (values: LoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });

      if (response.status === "success") {
        const token =
          (response.data as { accessToken?: string; token?: string })
            .accessToken ??
          (response.data as { accessToken?: string; token?: string })?.token;
        const responseUser = (
          response.data as {
            user?: { name?: string; email?: string };
          }
        ).user;
        const user =
          responseUser?.name && responseUser.email
            ? { name: responseUser.name, email: responseUser.email }
            : responseUser?.name
              ? { name: responseUser.name, email: values.email.trim() }
              : null;

        if (token) {
          setAuth({ user, token }, rememberMe);
        }

        toast.success("Signed in successfully.");
        reset({ email: values.email.trim(), password: "" });
        router.push("/dashboard");
        return;
      }

      toast.error(response.message ?? "Login failed. Please try again.");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Unable to sign in. Please try again.";
      toast.error(message);
    }
  };

  const onInvalidSubmit = () => {
    toast.error("Please fix the highlighted fields and try again.");
  };

  return (
    <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <User className="size-10 text-white" />
          </div>
          <h1 className={loginStyles.headerTitle}>Welcome Back</h1>
          <p className={loginStyles.headerSubtitle}>
            Sign in to your ExpenseTracker account
          </p>
        </div>

        <div className={loginStyles.formContainer}>
          <form
            onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
            className={""}
            noValidate
          >
            <div className="mb-6">
              <label htmlFor="email" className={loginStyles.label}>
                Email
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Mail className="size-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  autoComplete="on"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`${loginStyles.input} text-black! placeholder:text-gray-400 focus:outline-0 ${
                    errors.email ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="user@expensetracker.com"
                />
              </div>
              {errors.email && (
                <p id="email-error" className={loginStyles.errorText}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className={loginStyles.label}>
                Password
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Lock className="size-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register("password")}
                  autoComplete="on"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={`${loginStyles.passwordInput} text-black placeholder:text-gray-400 focus:outline-0 ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={loginStyles.passwordToggle}
                >
                  {showPassword ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className={loginStyles.errorText}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className={loginStyles.checkboxContainer}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={loginStyles.checkbox}
              />
              <label htmlFor="rememberMe" className={loginStyles.checkboxLabel}>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className={`${loginStyles.button} hover:scale-105 transition-transform ease-in-out duration-300 ${isSubmitting ? loginStyles.buttonDisabled : ""}`}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-5 w-5 mr-2 text-gray-300 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className={loginStyles.signUpContainer}>
            <p className={loginStyles.signUpText}>
              Don&apos;t have an account?{"  "}
              <Link href="/signup" className={loginStyles.signUpLink}>
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
