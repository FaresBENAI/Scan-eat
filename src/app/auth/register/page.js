'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, User, Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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
      <Link href="/" style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#495057',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }} className="back-btn">
        <ArrowLeft size={20} />
        <span>Retour à l'accueil</span>
      </Link>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        maxWidth: '600px',
        boxShadow: '0 20px 60px rgba(29, 33, 41, 0.1)',
        border: '1px solid rgba(233, 236, 239, 0.5)',
        transition: 'all 0.4s ease'
      }} className="register-card">
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
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
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1d2129',
            marginBottom: '0.5rem',
            margin: 0
          }}>
            Créer votre compte
          </h1>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            margin: '0.5rem 0 0 0'
          }}>
            Choisissez votre type de compte pour commencer
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          backgroundColor: '#f8f9fa',
          padding: '0.5rem',
          borderRadius: '16px',
          border: '1px solid #e9ecef'
        }}>
          <button 
            onClick={() => {
              setActiveTab('restaurant');
              setError('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: activeTab === 'restaurant' ? '#1d2129' : 'transparent',
              color: activeTab === 'restaurant' ? 'white' : '#6c757d',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            className="tab-btn"
          >
            <Building2 size={20} />
            <span>Restaurant</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('client');
              setError('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: activeTab === 'client' ? '#1d2129' : 'transparent',
              color: activeTab === 'client' ? 'white' : '#6c757d',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            className="tab-btn"
          >
            <User size={20} />
            <span>Client</span>
          </button>
        </div>

        {/* Restaurant Form */}
        {activeTab === 'restaurant' && (
          <form onSubmit={handleRestaurantRegister}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1d2129',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                Informations du restaurant
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="restaurantName" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Nom du restaurant *
                </label>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  value={restaurantData.restaurantName}
                  onChange={handleRestaurantChange}
                  required
                  placeholder="Le Petit Bistrot"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: `2px solid ${error && !restaurantData.restaurantName ? '#dc3545' : '#e9ecef'}`,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="phone" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={restaurantData.phone}
                  onChange={handleRestaurantChange}
                  placeholder="+33 1 23 45 67 89"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="address" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Adresse
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={restaurantData.address}
                  onChange={handleRestaurantChange}
                  placeholder="123 rue de la Paix, Paris"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1d2129',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                Compte d'accès
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={restaurantData.email}
                  onChange={handleRestaurantChange}
                  required
                  placeholder="votre@email.com"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: `2px solid ${error && !restaurantData.email ? '#dc3545' : '#e9ecef'}`,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label htmlFor="password" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#1d2129',
                    fontSize: '0.95rem'
                  }}>
                    Mot de passe *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={restaurantData.password}
                      onChange={handleRestaurantChange}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingRight: '3rem',
                        borderRadius: '12px',
                        border: `2px solid ${error && restaurantData.password.length < 6 ? '#dc3545' : '#e9ecef'}`,
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        color: '#1d2129',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#1d2129',
                    fontSize: '0.95rem'
                  }}>
                    Confirmer *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={restaurantData.confirmPassword}
                      onChange={handleRestaurantChange}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingRight: '3rem',
                        borderRadius: '12px',
                        border: `2px solid ${error && restaurantData.password !== restaurantData.confirmPassword ? '#dc3545' : '#e9ecef'}`,
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        color: '#1d2129',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? '#6c757d' : '#1d2129',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
              className="submit-btn"
            >
              {loading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                'Créer mon restaurant'
              )}
            </button>

            <div style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              color: '#6c757d',
              fontSize: '0.9rem'
            }}>
              Votre QR code sera généré automatiquement
            </div>
          </form>
        )}

        {/* Client Form */}
        {activeTab === 'client' && (
          <form onSubmit={handleClientRegister}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1d2129',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                Informations personnelles
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="clientName" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Nom complet *
                </label>
                <input
                  id="clientName"
                  name="name"
                  type="text"
                  value={clientData.name}
                  onChange={handleClientChange}
                  required
                  placeholder="Jean Dupont"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: `2px solid ${error && !clientData.name ? '#dc3545' : '#e9ecef'}`,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="clientPhone" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Téléphone
                </label>
                <input
                  id="clientPhone"
                  name="phone"
                  type="tel"
                  value={clientData.phone}
                  onChange={handleClientChange}
                  placeholder="+33 6 12 34 56 78"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1d2129',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                Compte d'accès
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="clientEmail" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#1d2129',
                  fontSize: '0.95rem'
                }}>
                  Email *
                </label>
                <input
                  id="clientEmail"
                  name="email"
                  type="email"
                  value={clientData.email}
                  onChange={handleClientChange}
                  required
                  placeholder="jean@email.com"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: `2px solid ${error && !clientData.email ? '#dc3545' : '#e9ecef'}`,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    color: '#1d2129',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  className="form-input"
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label htmlFor="clientPassword" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#1d2129',
                    fontSize: '0.95rem'
                  }}>
                    Mot de passe *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="clientPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={clientData.password}
                      onChange={handleClientChange}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingRight: '3rem',
                        borderRadius: '12px',
                        border: `2px solid ${error && clientData.password.length < 6 ? '#dc3545' : '#e9ecef'}`,
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        color: '#1d2129',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="clientConfirmPassword" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#1d2129',
                    fontSize: '0.95rem'
                  }}>
                    Confirmer *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="clientConfirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={clientData.confirmPassword}
                      onChange={handleClientChange}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingRight: '3rem',
                        borderRadius: '12px',
                        border: `2px solid ${error && clientData.password !== clientData.confirmPassword ? '#dc3545' : '#e9ecef'}`,
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        color: '#1d2129',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? '#6c757d' : '#1d2129',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
              className="submit-btn"
            >
              {loading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                'Créer mon compte client'
              )}
            </button>

            <div style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              color: '#6c757d',
              fontSize: '0.9rem'
            }}>
              Accédez à l'historique de vos commandes et au suivi en temps réel
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '2rem',
          borderTop: '1px solid #e9ecef',
          marginTop: '2rem'
        }}>
          <p style={{
            color: '#6c757d',
            fontSize: '0.95rem',
            margin: 0
          }}>
            Vous avez déjà un compte ?{' '}
            <Link href="/auth/login" style={{
              color: '#1d2129',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }} className="login-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .back-btn:hover {
          transform: translateX(-3px);
          color: #1d2129;
        }

        .register-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 80px rgba(29, 33, 41, 0.15);
        }

        .tab-btn:hover {
          transform: translateY(-2px);
          background-color: rgba(233, 236, 239, 0.7);
        }

        .form-input:focus {
          border-color: #1d2129 !important;
          box-shadow: 0 0 0 3px rgba(29, 33, 41, 0.1);
        }

        .form-input:hover {
          border-color: #495057;
        }

        .password-toggle:hover {
          color: #1d2129;
          background-color: #f8f9fa;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background-color: #495057;
          box-shadow: 0 8px 25px rgba(29, 33, 41, 0.2);
        }

        .login-link:hover {
          color: #495057;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .back-btn {
            position: static !important;
            margin-bottom: 2rem;
          }
          
          .register-card {
            margin-top: 0;
            padding: 2rem !important;
          }

          .form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}