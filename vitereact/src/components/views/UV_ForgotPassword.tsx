import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

interface ForgotPasswordRequest {
  email: string;
}

interface MessageResponse {
  message: string;
}

const UV_ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Define the mutation to call the forgot-password endpoint
  const mutation = useMutation<MessageResponse, Error, ForgotPasswordRequest>(
    (payload: ForgotPasswordRequest) =>
      axios
        .post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/auth/forgot-password`,
          payload
        )
        .then((response) => response.data),
    {
      onSuccess: (data) => {
        setSuccessMessage(data.message);
        setLocalError(null);
      },
      onError: (error: Error) => {
        setLocalError(error.message);
        setSuccessMessage(null);
      },
    }
  );

  // Basic email validation function
  const validateEmail = (email: string): boolean => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalError("Email is required.");
      return;
    }
    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    mutation.mutate({ email });
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        <p className="mb-4 text-gray-700">
          Enter your registered email address below. We will send you instructions on how to reset your password.
        </p>
        {localError && (
          <div className="mb-4 text-red-600">
            {localError}
          </div>
        )}
        {successMessage ? (
          <div className="mb-4 text-green-600">
            {successMessage}
            <div className="mt-2">
              <Link to="/login" className="text-blue-500 hover:underline">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="block text-gray-800 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {mutation.isLoading ? "Sending…" : "Send Reset Instructions"}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default UV_ForgotPassword;