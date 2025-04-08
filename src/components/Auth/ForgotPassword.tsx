import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext'; // Adjust path if needed
import type { AuthContextType } from '../../contexts/AuthContext';
import { Button } from '../ui/button'; // Adjust path if needed
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'; // Adjust path if needed
import { Input } from '../ui/input'; // Adjust path if needed
import { Label } from '../ui/label'; // Adjust path if needed
import { AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react'; // Added Icons

export const ForgotPassword = () => {
  const { resetPassword } = useContext(AuthContext) as AuthContextType;
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState(''); // Store email for success message

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await resetPassword(email);
      setSubmittedEmail(email); // Store email before setting success
      setResetSent(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to send reset email. Please check the email address or try again later.');
      setIsSubmitting(false); // Reset submitting state on error
    }
    // No finally needed if we want isSubmitting true until success screen
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black p-4 w-screen text-gray-300">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-700/50 shadow-xl">
        <CardHeader className="space-y-2 pb-6">
            {resetSent && (
                 <div className="flex justify-center mb-3">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
            )}
          <CardTitle className="text-2xl font-bold text-center text-gray-100">
            {resetSent ? 'Check Your Email' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription className="text-center text-gray-400 pt-1">
            {resetSent
              ? <>Instructions sent to <strong className="text-teal-400">{submittedEmail}</strong></>
              : 'Enter your email to receive a password reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && !resetSent && ( // Show error only on the form screen
            <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-md flex items-start gap-2">
               <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
               <span>{error}</span>
            </div>
          )}

          {resetSent ? (
            <p className="text-center text-sm text-gray-300 leading-relaxed">
              Please follow the instructions in the email to reset your password.
              If you don't see it within a few minutes, please check your spam folder.
            </p>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-gray-300">Email Address</Label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                    />
                 </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Link...
                     </>
                 ) : (
                    'Send Reset Link'
                 )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-700/50 pt-5 pb-6">
          <Link
             to="/login"
             className="text-sm text-teal-400 hover:text-teal-300 transition-colors duration-200 underline"
            >
            Return to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};