'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, Mail, CheckCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import './confirmation.css';

export default function Confirmation() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    // Simuler l'envoi d'email (à remplacer par la vraie logique)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResendSuccess(true);
      setTimeLeft(60);
      setCanResend(false);
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
    <div className="confirmation-container">
      {/* Back button */}
      <Link href="/auth/register" className="back-btn">
        <ArrowLeft size={20} />
        <span>Retour à l'inscription</span>
      </Link>

      <div className="confirmation-card">
        <div className="confirmation-header">
          <div className="logo">
            <QrCode size={32} />
            <span>Scan-eat</span>
          </div>
          
          <div className="success-icon">
            <Mail size={48} />
          </div>
          
          <h1>Vérifiez votre email</h1>
          <p>Nous venons d'envoyer un lien de confirmation à votre adresse email</p>
        </div>

        <div className="confirmation-content">
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Ouvrez votre boîte email</strong>
                <span>Vérifiez votre boîte de réception et vos spams</span>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Cliquez sur le lien</strong>
                <span>Cliquez sur "Confirmer mon email" dans le message</span>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Accédez à votre compte</strong>
                <span>Vous serez automatiquement connecté</span>
              </div>
            </div>
          </div>

          <div className="email-actions">
            {resendSuccess && (
              <div className="success-message">
                <CheckCircle size={20} />
                <span>Email envoyé avec succès !</span>
              </div>
            )}

            <div className="resend-section">
              <p>Vous n'avez pas reçu l'email ?</p>
              
              {!canResend ? (
                <div className="timer-info">
                  <Clock size={16} />
                  <span>Vous pourrez renvoyer l'email dans {formatTime(timeLeft)}</span>
                </div>
              ) : (
                <button 
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="resend-btn"
                >
                  {isResending ? (
                    <>
                      <div className="loading-spinner small"></div>
                      <span>Envoi en cours...</span>
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

          <div className="help-section">
            <h3>Problème avec la confirmation ?</h3>
            <div className="help-items">
              <div className="help-item">
                <strong>Vérifiez vos spams</strong>
                <span>L'email peut parfois arriver dans les indésirables</span>
              </div>
              <div className="help-item">
                <strong>Attendez quelques minutes</strong>
                <span>La livraison peut prendre jusqu'à 5 minutes</span>
              </div>
              <div className="help-item">
                <strong>Vérifiez l'adresse email</strong>
                <span>Assurez-vous d'avoir saisi la bonne adresse</span>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-footer">
          <div className="footer-links">
            <Link href="/auth/login">Se connecter</Link>
            <span>•</span>
            <Link href="/auth/register">Créer un autre compte</Link>
          </div>
          <div className="support-link">
            <p>Besoin d'aide ? <a href="mailto:support@scan-eat.com">Contactez le support</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
