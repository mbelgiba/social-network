"use client";

import { useState } from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const endpoint = isLogin ? "/api/login" : "/api/register";
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${endpoint}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Something went wrong");
      }

      if (isLogin) {
        setSuccess("Login successful! Redirecting...");
        // В будущем тут будет редирект на /feed
      } else {
        setSuccess("Registration successful! Please log in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="card w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-yellow">
        {isLogin ? "Welcome Back" : "Join the Network"}
      </h2>

      {error && <div className="bg-[#FF4444]/10 border border-[#FF4444] text-[#FF4444] p-3 rounded mb-4 text-sm">{error}</div>}
      {success && <div className="bg-[#4CAF50]/10 border border-[#4CAF50] text-[#4CAF50] p-3 rounded mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <>
            <div className="flex gap-4">
              <input type="text" name="first_name" placeholder="First Name" required onChange={handleChange} className="input-field w-full" />
              <input type="text" name="last_name" placeholder="Last Name" required onChange={handleChange} className="input-field w-full" />
            </div>
            <input type="date" name="date_of_birth" required onChange={handleChange} className="input-field w-full" />
          </>
        )}
        <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} className="input-field w-full" />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange} className="input-field w-full" />

        <button type="submit" className="btn-primary mt-2">
          {isLogin ? "Log In" : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)} className="text-yellow hover:text-yellow-bright underline">
          {isLogin ? "Register here" : "Login here"}
        </button>
      </div>
    </div>
  );
}