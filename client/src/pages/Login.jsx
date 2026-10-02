import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { login } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { useLoginUserMutation } from "../features/auth/authApiSlice";
import { useState } from "react";
function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    setServerError("");
    try {
      const result = await loginUser({
        email: formData.email,
        password: formData.password,
      }).unwrap();
      dispatch(
        login({
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        }),
      );
      navigate("/");
    } catch (err) {
      // لو الـ Backend رجع error بنعرضه
      setServerError(err.data?.message || "Invalid email or password");
    }
  };
  return (
    <div
      style={{ background: "var(--bg-secondary)" }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      {/* كارت الفورم */}
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        {/* العنوان */}
        <div className="text-center">
          <h2
            style={{ color: "var(--text-primary)" }}
            className="text-3xl font-bold "
          >
            Welcome Back
          </h2>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            Please enter your details to sign in
          </p>
        </div>
        {serverError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center">
            {serverError}
          </div>
        )}
        {/* الفورم */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            <p className="text-red-600">{errors.email?.message}</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              {...register("password", {
                minLength: {
                  value: 6,
                  message: "password must be 6 at least",
                },
                required: {
                  value: true,
                  message: "passord is required",
                },
              })}
            />
            <p className="text-red-600">{errors.password?.message}</p>
          </div>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <button
            disabled={isLoading}
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
          >
            {isLoading ? "Loading Users..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-bold hover:text-indigo-700"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
