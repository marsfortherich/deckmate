/**
 * Authentication Screen - Login & Registration
 * 
 * Combines login and registration in one component with tab switching
 */

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { isUsernameTaken } from '../../services/userService';
import { getErrorMessage } from '../../utils/errors';

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { login, register, user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Bitte gib einen Anzeigenamen ein');
          setIsLoading(false);
          return;
        }
        if (!username.trim()) {
          setError('Bitte gib einen Usernamen ein');
          setIsLoading(false);
          return;
        }
        // Check if username is already taken
        const usernameTaken = await isUsernameTaken(username);
        if (usernameTaken) {
          setError('Dieser Username ist bereits vergeben');
          setIsLoading(false);
          return;
        }
        await register(email, password, username, displayName);
      }
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Ein Fehler ist aufgetreten'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
      }}>
        <div style={{ color: '#f1f5f9', fontSize: '18px' }}>Lädt...</div>
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
        backgroundColor: '#0f172a',
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: '#1e293b',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '400px',
        }}>
          <h2 style={{ color: '#10b981', marginBottom: '24px', fontSize: '24px' }}>
            ✓ Erfolgreich eingeloggt!
          </h2>
          <div style={{
            padding: '16px',
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left',
          }}>
            <p style={{ margin: '8px 0', color: '#cbd5e1' }}>
              <strong>Name:</strong> {user.displayName || 'Nicht gesetzt'}
            </p>
            <p style={{ margin: '8px 0', color: '#cbd5e1' }}>
              <strong>Email:</strong> {user.email}
            </p>
            <p style={{ margin: '8px 0', color: '#64748b', fontSize: '13px' }}>
              <strong>ID:</strong> {user.uid}
            </p>
          </div>
          <button
            onClick={onSuccess}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Weiter zur App
          </button>
        </div>
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
      backgroundColor: '#0f172a',
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
          {mode === 'login' ? '🔐 Login' : '✨ Registrierung'}
        </h1>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '8px',
        }}>
          <button
            type="button"
            onClick={() => mode !== 'login' && switchMode()}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: mode === 'login' ? '#3b82f6' : 'transparent',
              color: mode === 'login' ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => mode !== 'register' && switchMode()}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: mode === 'register' ? '#3b82f6' : 'transparent',
              color: mode === 'register' ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            Registrierung
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
                }}>
                  Anzeigename
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
                  placeholder="Dein Name"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  placeholder="deinusername"
                />
                <p style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#64748b',
                }}>
                  Dein eindeutiger Username für die Freundessuche
                </p>
              </div>
            </>
          )}

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
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
            {mode === 'register' && (
              <p style={{
                marginTop: '6px',
                fontSize: '12px',
                color: '#64748b',
              }}>
                Mindestens 6 Zeichen
              </p>
            )}
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
            {isLoading
              ? 'Lädt...'
              : mode === 'login'
              ? 'Einloggen'
              : 'Registrieren'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
          }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onClick={() => {
                // TODO: Implement password reset
                alert('Password-Reset noch nicht implementiert');
              }}
            >
              Passwort vergessen?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
