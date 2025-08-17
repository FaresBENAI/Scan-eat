'use client';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader, QrCode, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import './callback.css';

function CallbackContent() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userType, setUserType] = useState('');
  const [debugInfo, setDebugInfo] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const router = useRouter();

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

      // Gérer les fragments URL (#access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);

      // Récupérer les paramètres depuis le hash OU l'URL
      const access_token = hashParams.get('access_token') || urlParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token') || urlParams.get('refresh_token');
      // ✅ CORRECTION: Accepter token_hash OU token
      const token_hash = urlParams.get('token_hash') || urlParams.get('token') || hashParams.get('token');
      const type = hashParams.get('type') || urlParams.get('type');

      addDebug(`📋 Tokens trouvés: access_token=${access_token ? 'OUI' : 'NON'}, refresh_token=${refresh_token ? 'OUI' : 'NON'}, token_hash=${token_hash ? 'OUI' : 'NON'}, type=${type}`);

      // Méthode 1: Si on a les tokens d'accès dans le hash
      if (access_token && refresh_token) {
        addDebug('🔑 Tentative avec tokens du hash');
        
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
          
          window.history.replaceState({}, document.title, window.location.pathname);
          
          setTimeout(() => {
            if (userInfo.type === 'restaurant') {
              router.push('/dashboard');
            } else {
              router.push('/');
            }
          }, 2000);
          return;
        }
      }

      // Méthode 2: Code de confirmation classique
      if (token_hash && type) {
        addDebug(`🔍 Tentative avec code de confirmation: ${token_hash.substring(0, 10)}...`);
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token_hash,
          type: 'email'
        });

        if (error) {
          addDebug(`❌ Erreur verifyOtp: ${error.message}`);
          throw error;
        }

        if (data.user) {
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
          }, 2000);
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
        }, 1000);
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
      <Link href="/" className="back-btn">
        <ArrowLeft size={20} />
        <span>Retour à l'accueil</span>
      </Link>
      
      <div className="callback-card">
        <div className="callback-header">
          <div className="logo">
            <QrCode size={32} />
            <span>Scan-eat</span>
          </div>
        </div>

        {status === 'loading' && (
          <div className="callback-content">
            <div className="callback-icon loading">
              <Loader size={48} className="spinner-icon" />
            </div>
            <h1>Confirmation en cours</h1>
            <p>Nous vérifions votre lien de confirmation, veuillez patienter...</p>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-content">
            <div className="callback-icon success">
              <CheckCircle size={48} />
            </div>
            <h1>Compte confirmé !</h1>
            <p>{message}</p>
            <div className="redirect-info">
              <p>Redirection automatique vers votre {userType === 'restaurant' ? 'dashboard' : 'accueil'} dans 2 secondes</p>
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
          </div>
        )}

        {status === 'error' && (
          <div className="callback-content">
            <div className="callback-icon error">
              <XCircle size={48} />
            </div>
            <h1>Erreur de confirmation</h1>
            <p>{message}</p>
            <div className="error-solutions">
              <h3>Solutions possibles :</h3>
              <div className="solution-list">
                <div className="solution-item">
                  <strong>Lien expiré ?</strong>
                  <span>Demandez un nouveau lien de confirmation</span>
                </div>
                <div class "solution-item">
                  <strong>Déjà confirmé ?</strong>
                  <span>Essayez de vous connecter directement</span>
                </div>
                <div className="solution-item">
                  <strong>Email différent ?</strong>
                  <span>Vérifiez que vous utilisez le bon lien</span>
                </div>
              </div>
            </div>
            <div className="callback-actions">
              <Link href="/auth/login" className="btn-primary">
                Se connecter
              </Link>
              <Link href="/auth/register" className="btn-secondary">
                Créer un nouveau compte
              </Link>
            </div>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="debug-toggle"
            >
              <AlertTriangle size={16} />
              <span>{showDebug ? 'Masquer' : 'Afficher'} les détails techniques</span>
            </button>
          </div>
        )}

        {showDebug && debugInfo.length > 0 && (
          <div className="debug-box">
            <div className="debug-header">
              <AlertTriangle size={20} />
              <span>Informations de débogage</span>
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
          <div className="callback-content">
            <div className="callback-icon loading">
              <Loader size={48} className="spinner-icon" />
            </div>
            <h1>Chargement</h1>
            <p>Préparation de la confirmation...</p>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
