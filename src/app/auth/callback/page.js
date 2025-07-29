'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import './callback.css';

function CallbackContent() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userType, setUserType] = useState('');
  const [debugInfo, setDebugInfo] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const addDebug = (text) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${text}`]);
  };

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
      addDebug('🚀 Début de la vérification');
      
      // Récupérer tous les paramètres de l'URL
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      
      addDebug(`📋 Paramètres URL: token=${token ? 'OUI' : 'NON'}, type=${type}, access_token=${access_token ? 'OUI' : 'NON'}`);

      // Méthode 1: Si on a les tokens d'accès
      if (access_token && refresh_token) {
        addDebug('🔑 Tentative avec access/refresh tokens');
        
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        
        if (error) {
          addDebug(`❌ Erreur setSession: ${error.message}`);
          throw error;
        }
        
        if (data.user) {
          addDebug(`✅ Utilisateur connecté: ${data.user.id}`);
          const userInfo = await detectUserType(data.user.id);
          setUserType(userInfo.type);
          setStatus('success');
          setMessage('Votre compte a été confirmé avec succès.');

          setTimeout(() => {
            if (userInfo.type === 'restaurant') {
              router.push('/dashboard');
            } else {
              router.push('/');
            }
          }, 3000);
          return;
        }
      }

      // Méthode 2: Avec le token hash
      if (token && type) {
        addDebug(`🔍 Tentative verifyOtp avec token et type=${type}`);
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'signup' ? 'signup' : 'email'
        });
        
        if (error) {
          addDebug(`❌ Erreur verifyOtp (${type}): ${error.message}`);
          
          // Essayer avec type 'magiclink'
          addDebug('🔄 Tentative avec type magiclink');
          const { data: data2, error: error2 } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink'
          });
          
          if (error2) {
            addDebug(`❌ Erreur verifyOtp (magiclink): ${error2.message}`);
            throw error2;
          }
          
          if (data2.user) {
            addDebug(`✅ Succès avec magiclink: ${data2.user.id}`);
            const userInfo = await detectUserType(data2.user.id);
            setUserType(userInfo.type);
            setStatus('success');
            setMessage('Votre compte a été confirmé avec succès.');

            setTimeout(() => {
              if (userInfo.type === 'restaurant') {
                router.push('/dashboard');
              } else {
                router.push('/');
              }
            }, 3000);
            return;
          }
        } else if (data.user) {
          addDebug(`✅ Succès verifyOtp: ${data.user.id}`);
          const userInfo = await detectUserType(data.user.id);
          setUserType(userInfo.type);
          setStatus('success');
          setMessage('Votre compte a été confirmé avec succès.');

          setTimeout(() => {
            if (userInfo.type === 'restaurant') {
              router.push('/dashboard');
            } else {
              router.push('/');
            }
          }, 3000);
          return;
        }
      }

      // Méthode 3: Vérifier si déjà connecté
      addDebug('🔍 Vérification session existante');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addDebug(`❌ Erreur session: ${sessionError.message}`);
        throw sessionError;
      }

      if (sessionData.session) {
        addDebug(`✅ Session trouvée: ${sessionData.session.user.id}`);
        const userInfo = await detectUserType(sessionData.session.user.id);
        setUserType(userInfo.type);
        setStatus('success');
        setMessage('Vous êtes déjà connecté.');

        setTimeout(() => {
          if (userInfo.type === 'restaurant') {
            router.push('/dashboard');
          } else {
            router.push('/');
          }
        }, 2000);
      } else {
        addDebug('❌ Aucune session trouvée');
        setStatus('error');
        setMessage('Lien de confirmation invalide ou expiré.');
      }
    } catch (error) {
      addDebug(`💥 Erreur finale: ${error.message}`);
      setStatus('error');
      setMessage('Erreur lors de la confirmation : ' + error.message);
    }
  };

  return (
    <div className="callback-container">
      <div className="callback-card">
        {status === 'loading' && (
          <>
            <div className="callback-icon">
              <Loader size={48} className="spinner-icon" />
            </div>
            <h1>Confirmation en cours</h1>
            <p>Nous vérifions votre lien de confirmation.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="callback-icon">
              <CheckCircle size={48} />
            </div>
            <h1>Compte confirmé</h1>
            <p>{message}</p>
            <div className="redirect-info">
              <p>Redirection automatique vers votre {userType === 'restaurant' ? 'dashboard' : 'accueil'} dans 3 secondes</p>
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
            <div className="callback-icon">
              <XCircle size={48} />
            </div>
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

        {/* Debug Box */}
        {debugInfo.length > 0 && (
          <div className="debug-box">
            <div className="debug-header">
              <AlertCircle size={20} />
              <span>Debug Info</span>
            </div>
            <div className="debug-content">
              {debugInfo.map((info, index) => (
                <div key={index} className="debug-line">{info}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="callback-container">
        <div className="callback-card">
          <div className="callback-icon">
            <Loader size={48} className="spinner-icon" />
          </div>
          <h1>Chargement</h1>
          <p>Préparation de la confirmation.</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
