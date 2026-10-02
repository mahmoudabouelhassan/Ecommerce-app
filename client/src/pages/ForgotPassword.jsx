import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useForgotPasswordMutation } from "../features/auth/authApiSlice";

function ForgotPassword() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      await forgotPassword(formData.email).unwrap();
      setSubmitted(true); //  بنعرض نفس الرسالة سواء نجح أو حتى لو الإيميل مش موجود
    } catch {
      setSubmitted(true); //  حتى لو حصل error، منورّيش اليوزر تفاصيل عشان منكشفش معلومات
    }
  };

  return (
    <div
      style={{ background: "var(--bg-secondary)" }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <div className="text-center">
          <h2
            style={{ color: "var(--text-primary)" }}
            className="text-3xl font-bold"
          >
            Forgot Password
          </h2>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {submitted ? (
          <div className="p-4 bg-green-100 border border-green-300 text-green-700 text-sm rounded-xl text-center">
            If an account exists with this email, you will receive a password
            reset link.
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
                className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-600 text-sm">{errors.email.message}</p>
              )}
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-60"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p
          className="text-center text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
