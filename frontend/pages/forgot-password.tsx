import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/password-reset/request`,
        { email }
      );

      if (response.data.success) {
        // In development mode, show the code
        if (response.data.devMode && response.data.devResetCode) {
          setDevCode(response.data.devResetCode);
        }
        setStep('code');
      }
    } catch (error: any) {
      // Show user-friendly error message
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 404) {
        setError("No account found with that email address. Please check your email or register for a new account.");
      } else if (error.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please make sure the server is running.");
      } else {
        setError("Failed to send reset code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/password-reset/reset`,
        { 
          email,
          resetCode,
          newPassword
        }
      );

      if (response.data.success) {
        alert("Password reset successfully! Redirecting to login...");
        router.push("/login");
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
        </h1>
        <p className="text-gray-600 text-center mb-6">
          {step === 'email' 
            ? "Enter your email to receive a reset code" 
            : "Enter the code sent to your email"}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleRequestReset}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                REGISTERED EMAIL <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            {devCode && (
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
                <p className="text-yellow-800 font-bold text-sm mb-1">🔧 Development Mode</p>
                <p className="text-yellow-800 text-sm mb-2">Your reset code is:</p>
                <p className="text-2xl font-bold text-yellow-900 text-center tracking-wider bg-yellow-200 py-2 rounded">
                  {devCode}
                </p>
                <p className="text-yellow-700 text-xs mt-2">
                  In production, this would be sent to your email.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                RESET CODE <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-wider font-mono text-gray-900 bg-white placeholder-gray-400"
                required
                disabled={loading}
                maxLength={6}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                NEW PASSWORD <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                CONFIRM PASSWORD <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setResetCode('');
                setNewPassword('');
                setConfirmPassword('');
                setDevCode(null);
                setError('');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded transition-colors"
            >
              Use Different Email
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
