import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LUIButton, LUIPasswordInput, useLUINotification, LUIUsernameInput } from '@/components';
import { useLogin } from '../auth.query';
import { useAuthStore } from '../auth.store';
import './loginpage.css';

export const LoginPage = () => {
  const login = useLogin();
  const navigate = useNavigate();
  const notify = useLUINotification();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    login.mutate(
      { username, password },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user);
          navigate({ to: '/' });
        },
        onError: (error) => {
          notify.error('Login failed', error.message || 'Unable to sign in', {
            position: 'bottom',
          });
        },
      },
    );
  };

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="login-header">
          <div className="login-brand">ABIS</div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your account to continue</p>
        </div>

        <LUIUsernameInput
          label="Username"
          placeholder="Enter your username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <LUIPasswordInput
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <LUIButton type="submit" size="lg" width="full" disabled={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Login'}
        </LUIButton>
      </form>
    </div>
  );
};
