'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Mail, CheckCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

export default function Confirmation() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Timer pour renvoyer l'email
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // ✅ POLLING CROSS-DEVICE AMÉLIORÉ
  useEffect(() => {
    const email = localStorage.getItem('pendingConfirmationEmail') || '';
    setUserEmail(email);
    
    let authInterval;
    let attempts = 0;
    const maxAttempts = 120; // 4 minutes max

    const checkAuthStatus = async () => {
      try {
        attempts++;
        
        // Vérifier la session Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Erreur session:', error.message);
          return false;
        }
        
        if (session?.user) {
          console.log('✅ Utilisateur confirmé détecté!', session.user.email);
          setIsCheckingAuth(false);
          
          // Détecter le type et rediriger
          const userInfo = await detectUserType(session.user.id);
          
          // Petite animation de succès
          setResendSuccess(true);
          
          setTimeout(() => {
            if (userInfo.type === 'restaurant') {
              router.push('/dashboard');
            } else {
              router.push('/');
            }
          }, 1000);
          
          return true; // Arrêter le polling
        }
        
        // Arrêter après 4 minutes
        if (attempts >= maxAttempts) {
          console.log('⏰ Timeout: arrêt du polling après 4 minutes');
          setIsCheckingAuth(false);
          return true;
        }
        
        return false; // Continuer le polling
      } catch (error) {
        console.log('Erreur vérification auth:', error.message);
        return false;
      }
    };

    // Vérification immédiate
    checkAuthStatus().then(connected => {
      if (!connected) {
        // Si pas encore connecté, démarrer le polling
        authInterval = setInterval(async () => {
          const isNowConnected = await checkAuthStatus();
          if (isNowConnected) {
            clearInterval(authInterval);
          }
        }, 2000); // Vérifier toutes les 2 secondes
      }
    });

    // ✅ ÉCOUTER les changements d'état Supabase (important!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Changement auth détecté:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          if (authInterval) clearInterval(authInterval);
          setIsCheckingAuth(false);
          
          const userInfo = await detectUserType(session.user.id);
          setResendSuccess(true);
          
          setTimeout(() => {
            if (userInfo.type === 'restaurant') {
              router.push('/dashboard');
            } else {
              router.push('/');
            }
          }, 1000);
        }
      }
    );

    return () => {
      if (authInterval) clearInterval(authInterval);
      subscription.unsubscribe();
    };
  }, [router]);

  const detectUserType = async (userId) => {
    try {
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', userId)
        .single();

      if (restaurantData) {
        return { type: 'restaurant' };
      }

      return { type: 'customer' };
    } catch (error) {
      return { type: 'customer' };
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      if (userEmail) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: userEmail
        });
        
        if (error) throw error;
        
        setResendSuccess(true);
        setTimeLeft(60);
        setCanResend(false);
      } else {
        throw new Error('Email non trouvé');
      }
    } catch (error) {
      console.error('Erreur renvoi email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <Link href="/auth/register" style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#495057',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: '500'
      }}>
        <ArrowLeft size={20} />
        <span>Retour à l'inscription</span>
      </Link>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(29, 33, 41, 0.1)',
        border: '1px solid rgba(233, 236, 239, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            backgroundColor: '#f8f9fa',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            color: '#495057'
          }}>
            <Mail size={48} />
          </div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1d2129',
            marginBottom: '0.5rem'
          }}>
            Vérifiez votre email
          </h1>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            margin: 0
          }}>
            Nous venons d'envoyer un lien de confirmation
          </p>
          {userEmail && (
            <p style={{
              color: '#495057',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginTop: '0.5rem'
            }}>
              {userEmail}
            </p>
          )}
        </div>

        {/* Status en temps réel */}
        {isCheckingAuth && (
          <div style={{
            backgroundColor: '#e8f4f8',
            border: '1px solid #bee5eb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid transparent',
                borderTop: '2px solid #0c5460',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ color: '#0c5460', fontWeight: '600' }}>
                Détection automatique active...
              </span>
            </div>
            <p style={{
              color: '#0c5460',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.5
            }}>
              <strong>Cliquez sur le lien dans votre email</strong><br/>
              Cette page détectera automatiquement votre confirmation<br/>
              <em>(même depuis un autre appareil)</em>
            </p>
          </div>
        )}

        {/* Message de succès si détecté */}
        {resendSuccess && !isCheckingAuth && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: '#155724'
            }}>
              <CheckCircle size={24} />
              <span style={{ fontWeight: '600' }}>
                Confirmation détectée ! Redirection...
              </span>
            </div>
          </div>
        )}

        {/* Resend Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              color: '#6c757d',
              marginBottom: '1rem'
            }}>
              Vous n'avez pas reçu l'email ?
            </p>
            
            {!canResend ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#6c757d'
              }}>
                <Clock size={16} />
                <span>Renvoyer dans {formatTime(timeLeft)}</span>
              </div>
            ) : (
              <button 
                onClick={handleResendEmail}
                disabled={isResending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isResending ? '#6c757d' : '#1d2129',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isResending ? 'not-allowed' : 'pointer',
                  margin: '0 auto'
                }}
              >
                {isResending ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Renvoyer l'email</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Link href="/auth/login" style={{
              color: '#495057',
              textDecoration: 'none'
            }}>
              Se connecter
            </Link>
            <span style={{ color: '#e9ecef' }}>•</span>
            <Link href="/auth/register" style={{
              color: '#495057',
              textDecoration: 'none'
            }}>
              Nouveau compte
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
