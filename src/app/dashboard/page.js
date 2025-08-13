'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  QrCode, Users, TrendingUp, Settings, LogOut, Menu, Plus, Download, 
  ExternalLink, CheckCircle, X, BarChart3, Clock, Bell, Eye
} from 'lucide-react';
import './dashboard.css';

function DashboardContent() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuth();
    
    // Vérifier si c'est une redirection après confirmation
    const type = searchParams.get('type');
    if (type === 'signup') {
      setShowWelcome(true);
      // Nettoyer l'URL
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/dashboard');
      }
    }

    // Fermer sidebar sur mobile lors du changement de route
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erreur restaurant:', error);
      } else {
        setRestaurant(restaurantData);
      }
    } catch (error) {
      console.error('Erreur auth:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirmed) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  const downloadQRCode = () => {
    if (restaurant?.qr_code_url) {
      const link = document.createElement('a');
      link.href = restaurant.qr_code_url;
      link.download = `QR-${restaurant.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openMenuPreview = () => {
    if (restaurant?.id) {
      window.open(`/menu/${restaurant.id}`, '_blank');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavigation = (itemId) => {
if (itemId === 'menu') {      router.push('/dashboard/menu');    } else if (itemId === 'orders') {      router.push('/dashboard/orders');    } else {      setActiveSection(itemId);    }
      setActiveSection(itemId);
    }
    closeSidebar();
  };

  const menuItems = [
    { id: 'overview', icon: BarChart3, label: 'Vue d\'ensemble', active: true },
    { id: 'menu', icon: Menu, label: 'Gestion du menu' },
    { id: 'orders', icon: Clock, label: 'Commandes' },
    { id: 'customers', icon: Users, label: 'Clients' },
    { id: 'analytics', icon: TrendingUp, label: 'Statistiques' },
    { id: 'settings', icon: Settings, label: 'Paramètres' }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de votre dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <CheckCircle size={24} />
            <span>Félicitations ! Votre compte a été confirmé avec succès.</span>
            <button 
              onClick={() => setShowWelcome(false)} 
              className="close-banner"
              aria-label="Fermer la bannière"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          onClick={toggleSidebar}
          className="mobile-menu-btn"
          aria-label="Ouvrir le menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <QrCode size={24} />
          <span>Scan-eat</span>
        </div>
        <div className="mobile-actions">
          <button className="notification-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <QrCode size={32} className="logo-icon" />
            <h2>Scan-eat</h2>
          </div>
          <button 
            onClick={closeSidebar}
            className="sidebar-close"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="restaurant-info-sidebar">
          <div className="restaurant-avatar">
            {restaurant?.name?.charAt(0) || 'R'}
          </div>
          <div className="restaurant-details">
            <strong>{restaurant?.name || 'Restaurant'}</strong>
            <span>{restaurant?.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeSection === 'overview' && (
          <>
            {/* Header */}
            <header className="dashboard-header">
              <div className="welcome-section">
                <h1>Bonjour, {restaurant?.name || 'Restaurant'} !</h1>
                <p>Voici un aperçu de votre activité aujourd'hui</p>
              </div>
              <div className="header-actions">
                <button 
                  onClick={openMenuPreview}
                  className="btn-secondary"
                >
                  <Eye size={20} />
                  <span className="btn-text">Voir mon menu</span>
                </button>
                <button 
                  onClick={() => router.push('/dashboard/menu')}
                  className="btn-primary"
                >
                  <Plus size={20} />
                  <span className="btn-text">Gérer le menu</span>
                </button>
              </div>
            </header>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon orders">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <h3>24</h3>
                  <p>Commandes aujourd'hui</p>
                  <span className="stat-change positive">+12%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <h3>458€</h3>
                  <p>Chiffre d'affaires</p>
                  <span className="stat-change positive">+8%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon customers">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <h3>127</h3>
                  <p>Clients servis</p>
                  <span className="stat-change positive">+15%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon menu">
                  <Menu size={24} />
                </div>
                <div className="stat-content">
                  <h3>0</h3>
                  <p>Plats au menu</p>
                  <span className="stat-change neutral">Commencer</span>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {restaurant?.qr_code_url && (
              <div className="qr-section">
                <div className="qr-card">
                  <div className="qr-content">
                    <div className="qr-info">
                      <h2>Votre QR Code</h2>
                      <p>Imprimez et placez ce QR code sur vos tables pour que vos clients puissent accéder au menu</p>
                      <div className="qr-actions">
                        <button onClick={downloadQRCode} className="btn-download">
                          <Download size={20} />
                          <span>Télécharger</span>
                        </button>
                        <button onClick={openMenuPreview} className="btn-preview">
                          <ExternalLink size={20} />
                          <span>Prévisualiser</span>
                        </button>
                      </div>
                    </div>
                    <div className="qr-display">
                      <div className="qr-container">
                        <img 
                          src={restaurant.qr_code_url} 
                          alt={`QR Code pour ${restaurant.name}`}
                          className="qr-image"
                        />
                        <div className="qr-label">
                          <QrCode size={16} />
                          <span>Scannez pour commander</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Actions rapides</h2>
              <div className="actions-grid">
                <div className="action-card">
                  <div className="action-icon">
                    <Menu size={32} />
                  </div>
                  <h3>Gérer votre menu</h3>
                  <p>Ajoutez vos premiers plats et commencez à vendre</p>
                  <button 
                    onClick={() => router.push('/dashboard/menu')}
                    className="action-btn"
                  >
                    Commencer
                </div>

                <div className="action-card">
                  <div className="action-icon">
                    <Clock size={32} />
                  </div>
                  <h3>Voir les commandes</h3>
                  <p>Consultez et gérez les commandes reçues</p>
                  <button 
                    onClick={() => router.push("/dashboard/orders")}
                    className="action-btn"
                  >
                    Voir commandes
                  </button>
                  </button>
                </div>

                <div className="action-card">
                  <div className="action-icon">
                    <QrCode size={32} />
                  </div>
                  <h3>Imprimer le QR Code</h3>
                  <p>Téléchargez et imprimez votre QR code pour vos tables</p>
                  <button onClick={downloadQRCode} className="action-btn">Télécharger</button>
                </div>

                <div className="action-card">
                  <div className="action-icon">
                    <Settings size={32} />
                  </div>
                  <h3>Personnaliser</h3>
                  <p>Ajoutez votre logo et personnalisez les couleurs</p>
                  <button className="action-btn">Configurer</button>
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="restaurant-info">
              <h2>Informations du restaurant</h2>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-item">
                    <strong>Nom du restaurant</strong>
                    <span>{restaurant?.name}</span>
                  </div>
                  <div className="info-item">
                    <strong>Email</strong>
                    <span>{restaurant?.email}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-item">
                    <strong>Téléphone</strong>
                    <span>{restaurant?.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Adresse</strong>
                    <span>{restaurant?.address || 'Non renseignée'}</span>
                  </div>
                </div>
                <div className="info-card full-width">
                  <div className="info-item">
                    <strong>URL du menu</strong>
                    <span className="menu-url">
                      {typeof window !== 'undefined' ? `${window.location.origin}/menu/${restaurant?.id}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Placeholder sections pour les autres vues */}
        {activeSection !== 'overview' && (
          <div className="placeholder-section">
            <div className="placeholder-content">
              <div className="placeholder-icon">
                {menuItems.find(item => item.id === activeSection)?.icon && 
                  React.createElement(menuItems.find(item => item.id === activeSection).icon, { size: 48 })
                }
              </div>
              <h2>{menuItems.find(item => item.id === activeSection)?.label}</h2>
              <p>Cette section sera développée prochainement.</p>
              <button 
                onClick={() => setActiveSection('overview')}
                className="btn-secondary"
              >
                Retour à la vue d'ensemble
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de votre dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
