'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { CheckSquare, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.data.token, data.data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ikea-gradient px-4">
      <Card className="w-full max-w-md bg-ikea-white border-4 border-ikea-yellow shadow-2xl">
        <CardHeader className="space-y-4 text-center bg-ikea-blue rounded-t-lg pb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="bg-ikea-yellow p-3 rounded-xl">
              <CheckSquare className="h-10 w-10 text-ikea-blue" />
            </div>
            <h1 className="text-3xl font-bold text-ikea-white">TaskBoard</h1>
          </div>
          <CardTitle className="text-2xl text-ikea-yellow font-bold">This app is named TaskBoard coz look at the domain</CardTitle>
          <CardDescription className="text-ikea-white/90 text-lg">
            Sign in to your account and  organize your tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-ikea-blue font-semibold text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
                disabled={loading}
                className="border-2 border-ikea-blue focus:border-ikea-yellow focus:ring-ikea-yellow text-lg p-4 rounded-lg"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-ikea-blue font-semibold text-lg">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-2 border-ikea-blue focus:border-ikea-yellow focus:ring-ikea-yellow text-lg p-4 pr-12 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ikea-blue hover:text-ikea-yellow transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-red-600 text-center font-semibold bg-red-50 p-3 rounded-lg border-2 border-red-200">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-xl py-4 rounded-xl shadow-lg border-2 border-ikea-blue hover:scale-105 transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-ikea-yellow/10 rounded-b-lg p-6">
          <p className="text-ikea-blue font-medium text-lg">
            Don't have an account?{' '}
            <Link href="/register" className="text-ikea-blue font-bold hover:text-ikea-yellow hover:underline transition-colors duration-200">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}