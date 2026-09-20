/**
 * Simple Login Component for Testing Firebase Auth
 */

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getErrorMessage } from '../../utils/errors';

export const LoginScreen: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Login fehlgeschlagen'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <h2 style={{ color: '#10b981', marginBottom: '16px' }}>✓ Erfolgreich eingeloggt!</h2>
        <div style={{
          padding: '16px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <p>User ID: {user.uid}</p>
          <p>Email: {user.email}</p>
        </div>
        <button
          onClick={onSuccess}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Weiter zur App
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#1e293b',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      }}>
        <h1 style={{
          fontSize: '28px',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#f1f5f9',
        }}>
          🔐 Login
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#cbd5e1',
              fontSize: '14px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f1f5f9',
                fontSize: '16px',
              }}
              placeholder="deine-email@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#cbd5e1',
              fontSize: '14px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f1f5f9',
                fontSize: '16px',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#7f1d1d',
              border: '1px solid #991b1b',
              borderRadius: '6px',
              marginBottom: '16px',
              color: '#fca5a5',
              fontSize: '14px',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isLoading ? '#64748b' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {isLoading ? 'Login läuft...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#0f172a',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#94a3b8',
        }}>
          <p style={{ marginBottom: '8px' }}>💡 Test-Credentials:</p>
          <p style={{ marginBottom: '4px' }}>Email: test@example.com</p>
          <p>Password: TestPassword123!</p>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            (User muss in Firebase Console angelegt sein)
          </p>
        </div>
      </div>
    </div>
  );
};
