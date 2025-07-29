'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const detectUserType = async (userId) => {
    try {
      // Vérifier d'abord dans la table restaurants
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (restaurantData && !restaurantError) {
        return { type: 'restaurant', data: restaurantData };
      }

      // Si pas trouvé dans restaurants, vérifier dans customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (customerData && !customerError) {
        return { type: 'customer', data: customerData };
      }

      // Si trouvé nulle part, erreur
      throw new Error('Profil utilisateur non trouvé');

    } catch (error) {
      console.error('Erreur détection type:', error);
      throw error;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authentification Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Détecter le type d'utilisateur
      const userInfo = await detectUserType(authData.user.id);

      // 3. Rediriger selon le type
      if (userInfo.type === 'restaurant') {
        router.push('/dashboard');
      } else if (userInfo.type === 'customer') {
        // Pour l'instant, rediriger vers l'accueil
        // Plus tard on aura un dashboard client
        router.push('/');
      }

    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Connexion à Scan-eat</h1>
          <p>Connectez-vous à votre compte restaurant ou client</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-info">
          <div className="user-types">
            <div className="user-type">
              <strong>Restaurant :</strong> Accédez à votre dashboard de gestion
            </div>
            <div className="user-type">
              <strong>Client :</strong> Consultez vos commandes et favoris
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <p>Pas encore de compte ?{' '}
            <Link href="/auth/register">S'inscrire</Link>
          </p>
          <Link href="/" className="back-home">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
