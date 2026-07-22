import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@estatevista.com");
  const [password, setPassword] = useState("Password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left panel - brand showcase */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand to-brand-dark text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Home size={20} />
          </div>
          <span className="font-bold text-xl">EstateVista</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Discover Your Dream Property and Navigate the Market
          </h2>
          <p className="text-white/80 text-sm">
            Transform your real estate operations with a single dashboard — capture leads, manage
            inventory, and close deals faster.
          </p>
          <div className="mt-8 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 max-w-xs">
            <p className="text-xs text-white/70">Property Rent</p>
            <p className="text-2xl font-bold mt-1">$4,450</p>
            <p className="text-xs text-green-300 mt-1">▲ +2.08% vs last month</p>
          </div>
        </div>

        <p className="text-xs text-white/60 relative z-10">© 2026 EstateVista. All rights reserved.</p>

        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute top-1/3 -left-16 w-64 h-64 rounded-full bg-white/5" />
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            <span className="font-bold text-lg">EstateVista</span>
          </div>

          <h1 className="text-2xl font-bold text-ink mb-1">Welcome Back to EstateVista!</h1>
          <p className="text-sm text-slate mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-danger text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-line focus:border-brand focus:ring-2 focus:ring-brand-tint outline-none text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">Password</label>
                <a href="#" className="text-xs text-brand font-medium">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-line focus:border-brand focus:ring-2 focus:ring-brand-tint outline-none text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate">
              <input type="checkbox" defaultChecked className="accent-brand rounded" />
              Remember Me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark transition-colors text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-brand-tint/60 rounded-xl text-xs text-slate">
            <p className="font-semibold text-brand-dark mb-1">Demo credentials</p>
            <p>admin@estatevista.com · manager@estatevista.com · rohan@estatevista.com</p>
            <p>Password: Password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
