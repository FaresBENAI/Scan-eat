'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import './register.css';

export default function Register() {
  const [activeTab, setActiveTab] = useState('restaurant');
  
  // Restaurant form data
  const [restaurantData, setRestaurantData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    phone: '',
    address: ''
  });
  
  // Client form data  
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRestaurantChange = (e) => {
    setRestaurantData({
      ...restaurantData,
      [e.target.name]: e.target.value
    });
  };

  const handleClientChange = (e) => {
    setClientData({
      ...clientData,
      [e.target.name]: e.target.value
    });
  };

  const generateQRCode = async (restaurantId) => {
    try {
      const menuUrl = `${window.location.origin}/menu/${restaurantId}`;
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

  const handleRestaurantRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (restaurantData.password !== restaurantData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (restaurantData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: restaurantData.email,
        password: restaurantData.password,
      });

      if (authError) throw authError;

      let qrCodeUrl = null;
      if (authData.user) {
        qrCodeUrl = await generateQRCode(authData.user.id);
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('restaurants')
          .insert([
            {
              id: authData.user.id,
              email: restaurantData.email,
              name: restaurantData.restaurantName,
              phone: restaurantData.phone,
              address: restaurantData.address,
              qr_code_url: qrCodeUrl,
            }
          ]);

        if (profileError) throw profileError;
      }

      router.push('/auth/confirmation');

    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const handleClientRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (clientData.password !== clientData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (clientData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: clientData.email,
        password: clientData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('customers')
          .insert([
            {
              id: authData.user.id,
              name: clientData.name,
              email: clientData.email,
              phone: clientData.phone,
            }
          ]);

        if (profileError) throw profileError;
      }

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
          <p>Choisissez votre type de compte</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'restaurant' ? 'active' : ''}`}
            onClick={() => setActiveTab('restaurant')}
          >
            Restaurant
          </button>
          <button 
            className={`tab ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            Client
          </button>
        </div>

        {/* Restaurant Form */}
        {activeTab === 'restaurant' && (
          <form onSubmit={handleRestaurantRegister} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={restaurantData.email}
                  onChange={handleRestaurantChange}
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
                  value={restaurantData.restaurantName}
                  onChange={handleRestaurantChange}
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
                  value={restaurantData.phone}
                  onChange={handleRestaurantChange}
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
                  value={restaurantData.address}
                  onChange={handleRestaurantChange}
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
                  value={restaurantData.password}
                  onChange={handleRestaurantChange}
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
                  value={restaurantData.confirmPassword}
                  onChange={handleRestaurantChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? 'Création du compte...' : 'Créer mon restaurant'}
            </button>

            <div className="qr-info">
              <p><small>Votre QR code sera généré automatiquement</small></p>
            </div>
          </form>
        )}

        {/* Client Form */}
        {activeTab === 'client' && (
          <form onSubmit={handleClientRegister} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientName">Nom complet *</label>
                <input
                  id="clientName"
                  name="name"
                  type="text"
                  value={clientData.name}
                  onChange={handleClientChange}
                  required
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientEmail">Email *</label>
                <input
                  id="clientEmail"
                  name="email"
                  type="email"
                  value={clientData.email}
                  onChange={handleClientChange}
                  required
                  placeholder="jean@email.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientPhone">Téléphone</label>
                <input
                  id="clientPhone"
                  name="phone"
                  type="tel"
                  value={clientData.phone}
                  onChange={handleClientChange}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientPassword">Mot de passe *</label>
                <input
                  id="clientPassword"
                  name="password"
                  type="password"
                  value={clientData.password}
                  onChange={handleClientChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientConfirmPassword">Confirmer le mot de passe *</label>
                <input
                  id="clientConfirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={clientData.confirmPassword}
                  onChange={handleClientChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? 'Création du compte...' : 'Créer mon compte client'}
            </button>

            <div className="client-info">
              <p><small>Accédez à l'historique de vos commandes et au suivi en temps réel</small></p>
            </div>
          </form>
        )}

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
