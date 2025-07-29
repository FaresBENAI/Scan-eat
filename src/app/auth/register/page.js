'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import './register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateQRCode = async (restaurantId) => {
    try {
      // URL vers le menu du restaurant
      const menuUrl = `${window.location.origin}/menu/${restaurantId}`;
      
      // Générer le QR code en base64
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1d2129',
          light: '#ffffff'
        }
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Erreur génération QR:', error);
      return null;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Vérification des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Générer le QR code
      let qrCodeUrl = null;
      if (authData.user) {
        qrCodeUrl = await generateQRCode(authData.user.id);
      }

      // 3. Créer le profil restaurant avec QR code
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('restaurants')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              name: formData.restaurantName,
              phone: formData.phone,
              address: formData.address,
              qr_code_url: qrCodeUrl, // QR code généré automatiquement
            }
          ]);

        if (profileError) throw profileError;
      }

      // Rediriger vers une page de confirmation
      router.push('/auth/confirmation');

    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h1>Créer votre compte Scan-eat</h1>
          <p>Commencez à digitaliser votre restaurant</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="restaurantName">Nom du restaurant *</label>
              <input
                id="restaurantName"
                name="restaurantName"
                type="text"
                value={formData.restaurantName}
                onChange={handleChange}
                required
                placeholder="Le Petit Bistrot"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 rue de la Paix, Paris"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Mot de passe *</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>

          <div className="qr-info">
            <p><small>🎉 Votre QR code sera généré automatiquement !</small></p>
          </div>
        </form>

        <div className="auth-footer">
          <p>Vous avez déjà un compte ?{' '}
            <Link href="/auth/login">Se connecter</Link>
          </p>
          <Link href="/" className="back-home">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
