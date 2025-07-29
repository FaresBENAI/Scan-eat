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
      
      addDebug(`📋 Paramètres URL: token=${token ? 'OUI' : 'NON'}, type=${type}`);

      if (token && type) {
        addDebug(`🔍 Tentative avec exchangeCodeForSession`);
        
        // Nouvelle méthode recommandée par Supabase
        const { data, error } = await supabase.auth.exchangeCodeForSession(token);
        
        if (error) {
          addDebug(`❌ Erreur exchangeCodeForSession: ${error.message}`);
          
          // Fallback: essayer l'ancienne méthode
          addDebug(`🔄 Fallback vers verifyOtp`);
          
          const { data: data2, error: error2 } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });
          
          if (error2) {
            addDebug(`❌ Erreur verifyOtp: ${error2.message}`);
            throw error2;
          }
          
          if (data2.user) {
            addDebug(`✅ Succès verifyOtp: ${data2.user.id}`);
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
          addDebug(`✅ Succès exchangeCodeForSession: ${data.user.id}`);
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

      // Si pas de paramètres, vérifier si déjà connecté
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
        addDebug('❌ Aucune session trouvée - lien probablement expiré');
        setStatus('error');
        setMessage('Lien de confirmation invalide ou expiré. Essayez de vous connecter directement.');
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
              <Link href="/auth/login" className="btn-primary">
                Se connecter directement
              </Link>
              <Link href="/auth/register" className="btn-secondary">
                Créer un nouveau compte
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
