import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";
import { createUserInputSchema, CreateUserInput, User } from "@schema";

const UV_Registration: React.FC = () => {
  const navigate = useNavigate();
  const { set_auth_details, add_notification } = useAppStore((state) => ({
    set_auth_details: state.set_auth_details,
    add_notification: state.add_notification,
  }));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Since there is no registration endpoint in the OpenAPI spec, we simulate it.
  const registerUser = async (data: CreateUserInput): Promise<{ token: string; user: User }> => {
    // TODO: Endpoint not found in OpenAPI spec / Backend Server main code
    // Simulate the API call with a timeout and return dummy token and user data.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: "dummy-token",
          user: {
            id: "user_dummy",
            name: data.name,
            email: data.email,
            role: data.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        });
      }, 1000);
    });
  };

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Update global authentication details and redirect to the dashboard.
      set_auth_details(data.token, data.user);
      navigate("/");
    },
    onError: (error: any) => {
      // Handle error by adding a global notification.
      add_notification({
        id: Date.now().toString(),
        type: "error",
        message: "Registration failed. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const inputData: CreateUserInput = {
      name: fullName,
      email: email,
      password_hash: password,
      role: "agent", // Default role set to "agent" for new registrations.
    };
    const parsed = createUserInputSchema.safeParse(inputData);
    if (!parsed.success) {
      const errors: { [key: string]: string } = {};
      parsed.error.errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }
    mutation.mutate(inputData);
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded py-2 px-3"
              placeholder="Enter your full name"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm">{formErrors.name}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded py-2 px-3"
              placeholder="Enter your email"
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm">{formErrors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="password_hash" className="block text-gray-700">Password</label>
            <input
              id="password_hash"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded py-2 px-3"
              placeholder="Enter your password"
            />
            {formErrors.password_hash && (
              <p className="text-red-500 text-sm">{formErrors.password_hash}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </>
  );
};

export default UV_Registration;