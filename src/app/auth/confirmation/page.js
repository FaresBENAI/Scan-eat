import Link from 'next/link';
import './confirmation.css';

export default function Confirmation() {
  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">
          <div className="email-icon">📧</div>
        </div>
        
        <div className="confirmation-header">
          <h1>Vérifiez votre email</h1>
          <p>Nous avons envoyé un lien de confirmation à votre adresse email.</p>
        </div>

        <div className="confirmation-content">
          <div className="instruction-box">
            <h3>Prochaines étapes :</h3>
            <ol>
              <li>Consultez votre boîte de réception</li>
              <li>Cliquez sur le lien de confirmation</li>
              <li>Votre compte sera activé automatiquement</li>
            </ol>
          </div>
          
          <div className="spam-notice">
            <p><strong>Pas d'email ?</strong> Pensez à vérifier vos spams ou votre dossier promotions.</p>
          </div>
        </div>

        <div className="confirmation-footer">
          <Link href="/auth/login" className="btn-primary">
            Retour à la connexion
          </Link>
          <Link href="/" className="btn-secondary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
