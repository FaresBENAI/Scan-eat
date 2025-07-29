'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './callback.css';

export default function AuthCallback() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userType, setUserType] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const detectUserType = async (userId) => {
    try {
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (restaurantData) {
        return { type: 'restaurant', data: restaurantData };
      }

      const { data: customerData } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (customerData) {
        return { type: 'customer', data: customerData };
      }

      return { type: 'unknown', data: null };
    } catch (error) {
      return { type: 'unknown', data: null };
    }
  };

  const handleAuthCallback = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (data.session) {
        const userInfo = await detectUserType(data.session.user.id);
        setUserType(userInfo.type);
        setStatus('success');
        setMessage('Votre compte a été confirmé avec succès !');

        // Redirection automatique après 3 secondes
        setTimeout(() => {
          if (userInfo.type === 'restaurant') {
            router.push('/dashboard');
          } else {
            router.push('/');
          }
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Lien de confirmation invalide ou expiré.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la confirmation : ' + error.message);
    }
  };

  return (
    <div className="callback-container">
      <div className="callback-card">
        {status === 'loading' && (
          <>
            <div className="callback-icon loading">
              <div className="spinner"></div>
            </div>
            <h1>Confirmation en cours...</h1>
            <p>Nous vérifions votre lien de confirmation.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="callback-icon success">✓</div>
            <h1>Compte confirmé !</h1>
            <p>{message}</p>
            <div className="redirect-info">
              <p>Redirection automatique vers votre {userType === 'restaurant' ? 'dashboard' : 'accueil'} dans 3 secondes...</p>
            </div>
            <div className="callback-actions">
              {userType === 'restaurant' ? (
                <Link href="/dashboard" className="btn-primary">
                  Accéder au dashboard
                </Link>
              ) : (
                <Link href="/" className="btn-primary">
                  Retour à l'accueil
                </Link>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="callback-icon error">✗</div>
            <h1>Erreur de confirmation</h1>
            <p>{message}</p>
            <div className="callback-actions">
              <Link href="/auth/register" className="btn-primary">
                Créer un nouveau compte
              </Link>
              <Link href="/auth/login" className="btn-secondary">
                Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
