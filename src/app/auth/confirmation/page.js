import Link from 'next/link';

export default function Confirmation() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Vérifiez votre email</h1>
          <p>Nous avons envoyé un lien de confirmation à votre adresse email.</p>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-icon">📧</div>
          <p>Cliquez sur le lien dans votre email pour activer votre compte.</p>
          <p><small>Pensez à vérifier vos spams si vous ne recevez rien.</small></p>
        </div>

        <div className="auth-footer">
          <Link href="/auth/login" className="back-home">← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
