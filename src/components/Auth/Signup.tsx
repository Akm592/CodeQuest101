// src/components/auth/Signup.tsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Link, useNavigate } from "react-router-dom"; // If you are using React Router

const Signup: React.FC = () => {
  const { signUpWithPassword, signInWithOAuth, isLoading, error, clearError } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // If using react-router-dom

  const handleOAuthSignup = async (provider: "google" | "github" | "apple") => {
    await signInWithOAuth(provider);
  };

  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await signUpWithPassword(email, password);
    if (success) {
      // Optionally redirect or show success message
      navigate("/login"); // Redirect to login after signup, or to main app
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-96">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handlePasswordSignup}>
            <div className="grid gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignup("google")}
              disabled={isLoading}
            >
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignup("github")}
              disabled={isLoading}
            >
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignup("apple")}
              disabled={isLoading}
            >
              Apple
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
