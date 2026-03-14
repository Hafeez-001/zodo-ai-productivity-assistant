import React, { useState } from "react";
import { Link } from "react-router-dom";
import { register as registerApi } from "../../services/api.js";
import { useAuth } from "../../hooks/useAuth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (username.length < 3) {
      return setError("Username must be at least 3 characters");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    setError("");
    try {
      const data = await registerApi(username, password);
      loginUser(data.user, data.token);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 font-medium mt-2">Join Zodo and master your productivity</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Username</label>
            <input
              type="text"
              className="bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900"
              placeholder="Pick a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Password</label>
            <input
              type="password"
              className="bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Confirm Password</label>
            <input
              type="password"
              className="bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl border border-red-100 text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            {loading ? "Creating account..." : "Get Started with Zodo"}
          </button>
        </form>
        
        <div className="mt-10 text-center text-sm font-medium text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 transition-colors font-black decoration-2 underline-offset-4 hover:underline">
            Login Now
          </Link>
        </div>
      </div>
    </div>
  );
}
