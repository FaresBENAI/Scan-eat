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

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // ✅ CROSS-DEVICE avec vérification email_verified
  useEffect(() => {
    const email = localStorage.getItem('pendingConfirmationEmail') || '';
    setUserEmail(email);
    
    let authInterval;
    let attempts = 0;
    const maxAttempts = 120; // 4 minutes

    const checkEmailVerified = async () => {
      try {
        attempts++;
        console.log(`🔍 Vérification ${attempts}/${maxAttempts} pour: ${email}`);
        
        // ✅ MÉTHODE 1: Vérifier session locale
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Session locale trouvée');
          setIsCheckingAuth(false);
          const userInfo = await detectUserType(session.user.id);
          redirectUser(userInfo.type);
          return true;
        }

        // ✅ MÉTHODE 2: Vérifier si l'email est confirmé dans auth.users
        if (email) {
          try {
            // Utiliser RPC pour vérifier le statut email
            const { data: emailStatus, error: rpcError } = await supabase
              .rpc('check_email_verified', { user_email: email });

            if (rpcError) {
              console.log('❌ Erreur RPC:', rpcError.message);
              // Fallback: chercher dans nos tables
              return await checkInOurTables(email);
            }

            if (emailStatus && emailStatus.length > 0 && emailStatus[0].email_verified) {
              console.log('✅ Email confirmé détecté dans auth.users!');
              
              // L'email est confirmé, on peut maintenant essayer de récupérer la session
              // ou rediriger vers la connexion
              setIsCheckingAuth(false);
              const userType = await getUserTypeFromEmail(email);
              
              // Message de succès puis redirection vers login
              setResendSuccess(true);
              setTimeout(() => {
                router.push(`/auth/login?email=${encodeURIComponent(email)}`);
              }, 2000);
              
              return true;
            }
          } catch (rpcError) {
            console.log('🔄 RPC non disponible, fallback vers nos tables');
            return await checkInOurTables(email);
          }
        }

        // Arrêter après le temps maximum
        if (attempts >= maxAttempts) {
          console.log('⏰ Timeout: arrêt du polling');
          setIsCheckingAuth(false);
          return true;
        }

        return false;
      } catch (error) {
        console.log('Erreur vérification:', error.message);
        return false;
      }
    };

    const checkInOurTables = async (email) => {
      // Vérifier dans nos tables si l'utilisateur existe
      // (ce qui indique qu'il s'est inscrit et donc potentiellement confirmé)
      
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id, email')
        .eq('email', email)
        .single();

      const { data: customerData } = await supabase
        .from('customers')
        .select('id, email')
        .eq('email', email)
        .single();

      if (restaurantData || customerData) {
        console.log('✅ Utilisateur trouvé dans nos tables');
        setIsCheckingAuth(false);
        setResendSuccess(true);
        
        setTimeout(() => {
          router.push(`/auth/login?email=${encodeURIComponent(email)}`);
        }, 2000);
        
        return true;
      }
      
      return false;
    };

    const getUserTypeFromEmail = async (email) => {
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('email', email)
        .single();

      return restaurantData ? 'restaurant' : 'customer';
    };

    const redirectUser = (userType) => {
      setResendSuccess(true);
      setTimeout(() => {
        if (userType === 'restaurant') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }, 1000);
    };

    // Démarrer les vérifications
    checkEmailVerified().then(connected => {
      if (!connected) {
        authInterval = setInterval(async () => {
          const isNowConnected = await checkEmailVerified();
          if (isNowConnected) {
            clearInterval(authInterval);
          }
        }, 3000); // Toutes les 3 secondes
      }
    });

    // Écouter les changements Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Changement auth:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          if (authInterval) clearInterval(authInterval);
          setIsCheckingAuth(false);
          
          const userInfo = await detectUserType(session.user.id);
          redirectUser(userInfo.type);
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

      return restaurantData ? { type: 'restaurant' } : { type: 'customer' };
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
                Détection automatique...
              </span>
            </div>
            <p style={{
              color: '#0c5460',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.5
            }}>
              <strong>Cliquez sur le lien dans votre email</strong><br/>
              Vérification du statut de confirmation<br/>
              <em>(fonctionne même depuis un autre appareil)</em>
            </p>
          </div>
        )}

        {resendSuccess && (
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
                Email confirmé ! Redirection vers la connexion...
              </span>
            </div>
          </div>
        )}

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

        <div style={{
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e9ecef'
        }}>
          <p style={{ color: '#6c757d', margin: 0 }}>
            💡 Confirmé sur un autre appareil ?{' '}
            <Link href="/auth/login" style={{ color: '#1d2129', fontWeight: '600' }}>
              Connectez-vous ici
            </Link>
          </p>
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
