"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginStyles } from "@/app/assets/styles";
import { Spinner } from "@/app/components/spinner";
import { AuthService } from "@/app/services/auth";
import { toast } from "sonner";
import { Mail } from "lucide-react";

type ResendStatus = "idle" | "loading" | "sent" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const [message, setMessage] = useState("");

  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");

  // const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(120);

  const email =
    typeof window !== "undefined"
      ? sessionStorage.getItem("verificationEmail")
      : null;

  const handleVerifyCode = useCallback(async () => {
    if (!email) {
      setStatus("error");
      setMessage("Session expired. Please sign up again");
      return;
    }

    const verificationCode = code.join("");
    if (verificationCode.length !== 4) return;

    try {
      setIsVerifying(true);
      setMessage("");

      const response = await AuthService.verifyEmail({
        email: email.trim(),
        code: verificationCode,
      });

      if (response.status === "success") {
        setStatus("success");
        setMessage("Email verified successfully. Redirecting...");
        toast.success("Email verified successfully");
        setCode(["", "", "", ""]);
        router.push("/login");
        sessionStorage.setItem("verifiedEmail", JSON.stringify({ email }));
        sessionStorage.removeItem("verificationEmail");
      }
    } catch (error) {
      setStatus("error");
      const errMsg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Verification failed. Please try again.";
      setMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, router]);

  const handleChange = (index: number, value: string) => {
    const newCode = [...code];
    if (value.length > 1) {
      const pastedCode = value.replace(/\D/g, "").slice(0, 4).split("");
      for (let i = 0; i < 4; i++) newCode[i] = pastedCode[i] || "";
      setCode(newCode);
      const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
      const focusIndex = lastFilledIndex < 3 ? lastFilledIndex + 1 : 3;
      inputRefs.current[focusIndex]?.focus();
    } else {
      newCode[index] = value.replace(/\D/g, ""); // only allow digits
      setCode(newCode);
      if (value && index < 3) inputRefs.current[index + 1]?.focus();
    }
  };
  // Handle backspace to move focus backwards
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  useEffect(() => {
    if (code.length === 4) {
      handleVerifyCode();
    }
  }, [code, handleVerifyCode]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResendVerification = async () => {
    if (!email) return;

    setResendStatus("loading");
    try {
      const response = await AuthService.requestEmailVerification(email);

      if (response.status === "success") {
        setResendStatus("sent");
        setTimeLeft(180);

        toast.success("A new verification code has been sent.");
      }
    } catch (error) {
      setResendStatus("error");

      toast.error("Failed to resend code.");
    }
  };

  return (
    <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <Mail className="size-10 text-white" />
          </div>

          <h1 className={loginStyles.headerTitle}>Verify Email</h1>
          <p className={loginStyles.headerSubtitle}>
            Enter the 4-digit code sent to{" "}
            <strong className="underline">{email}</strong>
          </p>
        </div>
        <div className={loginStyles.formContainer}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyCode();
            }}
            className="space-y-6"
          >
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  className="size-14 text-center text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-800 transition-all outline-none"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <button
              className={loginStyles.button}
              type="submit"
              disabled={isVerifying || code.some((digit) => digit === "")}
            >
              {isVerifying ? <Spinner className="size-5" /> : "Verify Code"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            {timeLeft > 0 ? (
              <p>
                Resend code in {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </p>
            ) : (
              <button
                onClick={handleResendVerification}
                className="text-emerald-600 font-semibold hover:underline"
              >
                Resend Verification Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
