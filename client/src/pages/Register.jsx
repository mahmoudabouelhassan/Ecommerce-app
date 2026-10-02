import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterUserMutation } from "../features/auth/authApiSlice";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { login } from "../features/auth/authSlice";
function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [registerUser, { isLoading }] = useRegisterUserMutation();

  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = async (formData) => {
    setServerError("");
    try {
      // بنبعت البيانات للـ Backend عشان يعمل الـ user ويرجع token
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }).unwrap();

      // بنحفظ الـ user في الـ Redux مع الـ token
      dispatch(
        login({
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        }),
      );

      navigate("/");
    } catch (err) {
      setServerError(
        err.data?.message || "Registration failed. Please try again.",
      );
    }
  };
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <h2
          className="text-3xl font-bold text-center"
          style={{ color: "var(--text-primary)" }}
        >
          Create Account
        </h2>

        {serverError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          Already have an account?{" "}
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

export default Register;
