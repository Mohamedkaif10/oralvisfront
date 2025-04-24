import React, { useState } from "react";
import { BeatLoader, RingLoader } from "react-spinners";
import { css } from "@emotion/react";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: white;
`;

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isRegister
      ? "https://oralvisbackend.onrender.com/api/auth/register"
      : "https://oralvisbackend.onrender.com/api/auth/login";

    const body = isRegister ? { email, password, role } : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      if (!isRegister) {
        onLogin(data.token, data.role);
      } else {
        setIsRegister(false);
        setError("✅ Registration successful! Please log in.");
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center">
      <div className="bg-white w-full md:w-1/2 lg:w-1/3 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          {loading ? (
            <div className="flex justify-center mb-4">
              <RingLoader
                color={"#7e22ce"}
                loading={loading}
                css={override}
                size={60}
              />
            </div>
          ) : (
            <h2 className="text-2xl font-bold">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>
          )}
          <p className="text-gray-600 mt-2">
            {isRegister ? "Join our community today" : "Sign in to continue"}
          </p>
        </div>

        {error && (
          <div
            className={`p-3 rounded mb-4 text-sm ${
              error.includes("✅")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled={loading}
            />
          </div>

          {isRegister && (
            <div>
              <label className="block mb-1 text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={loading}
              >
                <option value="user">User</option>
                <option value="dentist">Dentist</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition ${
              loading ? "opacity-90 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <BeatLoader
                color={"#ffffff"}
                loading={loading}
                css={override}
                size={10}
              />
            ) : isRegister ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="ml-2 text-purple-600 hover:underline font-medium"
              disabled={loading}
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
