import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/users/login`,
        data
      );

      console.log('Login: API response:', response.data);

      // Handle the actual API response structure
      let user, token;
      if (response.data.data) {
        // The user data is directly in response.data.data
        user = response.data.data;
        // Token might be in response.data.token or we can use a default
        token = response.data.token || 'default-token';
      } else {
        // Fallback if no data wrapper
        user = response.data;
        token = response.data.token || 'default-token';
      }

      console.log('Login: Extracted user:', user, 'token:', token);

      // Use AuthContext login method
      const result = await login(user, token);
      console.log('Login: Login result:', result);

      toast.success("Login successful!");

      // Navigation will be handled by the AuthContext or ProtectedRoute
      // based on user role
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#1a2a52] rounded-t-lg py-4 px-6">
          <h2 className="text-white text-center text-3xl font-extrabold">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-6 px-6 pb-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1a2a52] mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address"
                }
              })}
              className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-[#bfa75a] ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1a2a52] mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
              className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-[#bfa75a] ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md text-[#1a2a52] font-semibold bg-[#bfa75a] hover:bg-[#a88f3f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bfa75a] disabled:opacity-50 transition-colors duration-200"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Do not have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-[#1a2a52] hover:text-[#bfa75a] transition-colors duration-200"
              >
                Register now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
