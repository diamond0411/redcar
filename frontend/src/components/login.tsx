import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoginSignUpProps {
  onLogin: (token: string) => void;
}

const LoginSignUp: React.FC<LoginSignUpProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.token);
        setIsLogin(true);
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch {
      setError('An error occurred');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-800 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg overflow-hidden p-10 space-y-4">
        <h2 className="text-2xl font-bold text-center text-black">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 focus:border-indigo-600 focus:outline-hidden">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border-solid w-full text-black bg-gray-300"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border-solid w-full text-black bg-gray-300"
            required
          />
          <Button type="submit" className="w-full">
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>
        {error && (
          <div className="text-red-500 text-center text-xs">{error}</div>
        )}
        <Button
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center text-blue-400"
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </Button>
      </div>
    </div>
  );
};

export default LoginSignUp;