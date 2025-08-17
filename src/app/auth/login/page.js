'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Eye, EyeOff, ArrowLeft, LogIn, User, Building2 } from 'lucide-react';
import './login.css';

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
    <div className="login-container">
      {/* Back button */}
      <Link href="/" className="back-btn">
        <ArrowLeft size={20} />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <QrCode size={32} />
            <span>Scan-eat</span>
          </div>
          <h1>Connexion</h1>
          <p>Connectez-vous à votre compte restaurant ou client</p>
        </div>

        {/* Info section */}
        <div className="user-types-info">
          <div className="user-type-item">
            <div className="user-type-icon restaurant">
              <Building2 size={20} />
            </div>
            <div className="user-type-content">
              <strong>Restaurant</strong>
              <span>Accédez à votre dashboard de gestion</span>
            </div>
          </div>
          <div className="user-type-item">
            <div className="user-type-icon client">
              <User size={20} />
            </div>
            <div className="user-type-content">
              <strong>Client</strong>
              <span>Consultez vos commandes et favoris</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="votre@email.com"
              className={error && !email.trim() ? 'error' : ''}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="••••••••"
                className={error && !password.trim() ? 'error' : ''}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        {/* Forgot password link */}
        <div className="forgot-password">
          <Link href="/auth/forgot-password">Mot de passe oublié ?</Link>
        </div>

        <div className="login-footer">
          <p>Pas encore de compte ?{' '}
            <Link href="/auth/register">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}