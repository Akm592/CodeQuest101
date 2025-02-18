// src/components/auth/Login.tsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Link } from "react-router-dom"; // If you are using React Router

const Login: React.FC = () => {
  const { signInWithOAuth, signInWithPassword, isLoading, error, clearError } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleOAuthLogin = async (provider: "google" | "github" | "apple") => {
    await signInWithOAuth(provider);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signInWithPassword(email, password);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-96">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Log In</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handlePasswordLogin}>
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
                {isLoading ? "Logging in..." : "Log In"}
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
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoading}
            >
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin("github")}
              disabled={isLoading}
            >
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin("apple")}
              disabled={isLoading}
            >
              Apple
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
