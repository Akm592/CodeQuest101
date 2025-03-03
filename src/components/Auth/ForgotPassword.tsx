// ../../../src/components/Auth/ForgotPassword.tsx
// // Code for the ForgotPassword component 
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export const ForgotPassword = () => {
  const { resetPassword } = useAuth() as unknown as { resetPassword: (email: string) => Promise<void> };
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      await resetPassword(email);
      setResetSent(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 w-screen">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {resetSent ? 'Check Your Email' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-center">
            {resetSent 
              ? `We've sent recovery instructions to ${email}` 
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          {resetSent ? (
            <p className="text-center text-sm text-gray-600">
              Please check your email and follow the instructions to reset your password.
              If you don't see the email, check your spam folder.
            </p>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};