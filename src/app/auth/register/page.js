'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, User, Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './register.css';

export default function Register() {
  const [activeTab, setActiveTab] = useState('restaurant');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
    if (error) setError('');
  };

  const handleClientChange = (e) => {
    setClientData({
      ...clientData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const generateQRCode = async (restaurantId) => {
    try {
      const menuUrl = `${window.location.origin}/menu/${restaurantId}`;
      const QRCode = await import('qrcode');
      const qrCodeDataUrl = await QRCode.default.toDataURL(menuUrl, {
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

  const validateForm = (data, isRestaurant) => {
    if (data.password !== data.confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    if (data.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (isRestaurant && !data.restaurantName.trim()) {
      return 'Le nom du restaurant est requis';
    }
    if (!isRestaurant && !data.name.trim()) {
      return 'Le nom est requis';
    }
    return null;
  };

  const handleRestaurantRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm(restaurantData, true);
    if (validationError) {
      setError(validationError);
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

    const validationError = validateForm(clientData, false);
    if (validationError) {
      setError(validationError);
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

  const currentData = activeTab === 'restaurant' ? restaurantData : clientData;

  return (
    <div className="register-container">
      {/* Back button */}
      <Link href="/" className="back-btn">
        <ArrowLeft size={20} />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="register-card">
        <div className="register-header">
          <div className="logo">
            <QrCode size={32} />
            <span>Scan-eat</span>
          </div>
          <h1>Créer votre compte</h1>
          <p>Choisissez votre type de compte pour commencer</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'restaurant' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('restaurant');
              setError('');
            }}
          >
            <Building2 size={20} />
            <span>Restaurant</span>
          </button>
          <button 
            className={`tab ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('client');
              setError('');
            }}
          >
            <User size={20} />
            <span>Client</span>
          </button>
        </div>

        {/* Restaurant Form */}
        {activeTab === 'restaurant' && (
          <form onSubmit={handleRestaurantRegister} className="register-form">
            <div className="form-section">
              <h3>Informations du restaurant</h3>
              
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
                  className={error && !restaurantData.restaurantName ? 'error' : ''}
                />
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

            <div className="form-section">
              <h3>Compte d'accès</h3>
              
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
                  className={error && !restaurantData.email ? 'error' : ''}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Mot de passe *</label>
                  <div className="password-input">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={restaurantData.password}
                      onChange={handleRestaurantChange}
                      required
                      placeholder="••••••••"
                      className={error && restaurantData.password.length < 6 ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmer *</label>
                  <div className="password-input">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={restaurantData.confirmPassword}
                      onChange={handleRestaurantChange}
                      required
                      placeholder="••••••••"
                      className={error && restaurantData.password !== restaurantData.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                'Créer mon restaurant'
              )}
            </button>

            <div className="form-info">
              <p>Votre QR code sera généré automatiquement</p>
            </div>
          </form>
        )}

        {/* Client Form */}
        {activeTab === 'client' && (
          <form onSubmit={handleClientRegister} className="register-form">
            <div className="form-section">
              <h3>Informations personnelles</h3>
              
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
                  className={error && !clientData.name ? 'error' : ''}
                />
              </div>

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

            <div className="form-section">
              <h3>Compte d'accès</h3>
              
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
                  className={error && !clientData.email ? 'error' : ''}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clientPassword">Mot de passe *</label>
                  <div className="password-input">
                    <input
                      id="clientPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={clientData.password}
                      onChange={handleClientChange}
                      required
                      placeholder="••••••••"
                      className={error && clientData.password.length < 6 ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="clientConfirmPassword">Confirmer *</label>
                  <div className="password-input">
                    <input
                      id="clientConfirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={clientData.confirmPassword}
                      onChange={handleClientChange}
                      required
                      placeholder="••••••••"
                      className={error && clientData.password !== clientData.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                'Créer mon compte client'
              )}
            </button>

            <div className="form-info">
              <p>Accédez à l'historique de vos commandes et au suivi en temps réel</p>
            </div>
          </form>
        )}

        <div className="register-footer">
          <p>Vous avez déjà un compte ?{' '}
            <Link href="/auth/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
