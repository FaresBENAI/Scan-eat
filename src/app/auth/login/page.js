'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Eye, EyeOff, ArrowLeft, LogIn, User, Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const detectUserType = async (userId) => {
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (restaurantData && !restaurantError) {
        return { type: 'restaurant', data: restaurantData };
      }

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (customerData && !customerError) {
        return { type: 'customer', data: customerData };
      }

      throw new Error('Profil utilisateur non trouvé');

    } catch (error) {
      console.error('Erreur détection type:', error);
      throw error;
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation côté client
    if (!email.trim()) {
      setError('L\'email est requis');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Le mot de passe est requis');
      setLoading(false);
      return;
    }

    try {
      // 1. Authentification Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      // 2. Détecter le type d'utilisateur
      const userInfo = await detectUserType(authData.user.id);

      // 3. Rediriger selon le type
      if (userInfo.type === 'restaurant') {
        router.push('/dashboard');
      } else if (userInfo.type === 'customer') {
        router.push('/');
      }

    } catch (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(error.message);
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Back button */}
      <Link href="/" style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#495057',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }} className="back-btn">
        <ArrowLeft size={20} />
        <span>Retour à l'accueil</span>
      </Link>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(29, 33, 41, 0.1)',
        border: '1px solid rgba(233, 236, 239, 0.5)',
        transition: 'all 0.4s ease'
      }} className="login-card">
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1d2129'
          }}>
            <QrCode size={32} style={{ color: '#495057' }} />
            <span>Scan-eat</span>
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1d2129',
            marginBottom: '0.5rem',
            margin: 0
          }}>
            Connexion
          </h1>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            margin: '0.5rem 0 0 0'
          }}>
            Connectez-vous à votre compte restaurant ou client
          </p>
        </div>

        {/* User Types Info */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '16px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1
          }} className="user-type-item">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#1d2129',
              borderRadius: '12px',
              color: 'white',
              transition: 'all 0.3s ease'
            }} className="user-type-icon">
              <Building2 size={20} />
            </div>
            <div>
              <div style={{
                fontWeight: '600',
                color: '#1d2129',
                fontSize: '0.9rem'
              }}>
                Restaurant
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#6c757d'
              }}>
                Dashboard de gestion
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1
          }} className="user-type-item">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#495057',
              borderRadius: '12px',
              color: 'white',
              transition: 'all 0.3s ease'
            }} className="user-type-icon">
              <User size={20} />
            </div>
            <div>
              <div style={{
                fontWeight: '600',
                color: '#1d2129',
                fontSize: '0.9rem'
              }}>
                Client
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#6c757d'
              }}>
                Commandes et favoris
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1d2129',
              fontSize: '0.95rem'
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="votre@email.com"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: `2px solid ${error && !email.trim() ? '#dc3545' : '#e9ecef'}`,
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                backgroundColor: 'white',
                color: '#1d2129',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1d2129',
              fontSize: '0.95rem'
            }}>
              Mot de passe
            </label>
            <div style={{
              position: 'relative'
            }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  paddingRight: '3rem',
                  borderRadius: '12px',
                  border: `2px solid ${error && !password.trim() ? '#dc3545' : '#e9ecef'}`,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  color: '#1d2129',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                className="form-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6c757d',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease'
                }}
                className="password-toggle"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading ? '#6c757d' : '#1d2129',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
            className="login-btn"
          >
            {loading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        {/* Forgot password link */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <Link href="/auth/forgot-password" style={{
            color: '#495057',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }} className="forgot-link">
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e9ecef'
        }}>
          <p style={{
            color: '#6c757d',
            fontSize: '0.95rem',
            margin: 0
          }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" style={{
              color: '#1d2129',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }} className="register-link">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .back-btn:hover {
          transform: translateX(-3px);
          color: #1d2129;
        }

        .login-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 80px rgba(29, 33, 41, 0.15);
        }

        .user-type-item:hover .user-type-icon {
          transform: scale(1.1);
          background-color: #495057;
        }

        .form-input:focus {
          border-color: #1d2129 !important;
          box-shadow: 0 0 0 3px rgba(29, 33, 41, 0.1);
        }

        .form-input:hover {
          border-color: #495057;
        }

        .password-toggle:hover {
          color: #1d2129;
          background-color: #f8f9fa;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background-color: #495057;
          box-shadow: 0 8px 25px rgba(29, 33, 41, 0.2);
        }

        .forgot-link:hover {
          color: #1d2129;
          text-decoration: underline;
        }

        .register-link:hover {
          color: #495057;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .back-btn {
            position: static !important;
            margin-bottom: 2rem;
          }
          
          .login-card {
            margin-top: 0;
            padding: 2rem !important;
          }

          .user-types-info {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}