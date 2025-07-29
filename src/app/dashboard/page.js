'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { QrCode, Users, TrendingUp, Settings, LogOut, Menu, Plus } from 'lucide-react';
import './dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Récupérer les données du restaurant
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
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de votre dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <QrCode size={32} className="logo-icon" />
          <h2>Scan-eat</h2>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <TrendingUp size={20} />
            <span>Tableau de bord</span>
          </div>
          <div className="nav-item">
            <Menu size={20} />
            <span>Menu</span>
          </div>
          <div className="nav-item">
            <Users size={20} />
            <span>Commandes</span>
          </div>
          <div className="nav-item">
            <Settings size={20} />
            <span>Paramètres</span>
          </div>
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
        {/* Header */}
        <header className="dashboard-header">
          <div className="welcome-section">
            <h1>Bonjour, {restaurant?.name || 'Restaurant'} ! 👋</h1>
            <p>Voici un aperçu de votre activité aujourd'hui</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary">
              <Plus size={20} />
              Ajouter un plat
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orders">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>24</h3>
              <p>Commandes aujourd'hui</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>458€</h3>
              <p>Chiffre d'affaires</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon menu">
              <Menu size={24} />
            </div>
            <div className="stat-content">
              <h3>0</h3>
              <p>Plats au menu</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon qr">
              <QrCode size={24} />
            </div>
            <div className="stat-content">
              <h3>1</h3>
              <p>QR Code généré</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Actions rapides</h2>
          <div className="actions-grid">
            <div className="action-card">
              <Menu size={40} />
              <h3>Créer votre menu</h3>
              <p>Ajoutez vos premiers plats et commencez à vendre</p>
              <button className="action-btn">Commencer</button>
            </div>

            <div className="action-card">
              <QrCode size={40} />
              <h3>Télécharger le QR Code</h3>
              <p>Imprimez et placez sur vos tables</p>
              <button className="action-btn">Télécharger</button>
            </div>

            <div className="action-card">
              <Settings size={40} />
              <h3>Personnaliser</h3>
              <p>Ajoutez votre logo et personnalisez les couleurs</p>
              <button className="action-btn">Configurer</button>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="restaurant-info">
          <h2>Informations du restaurant</h2>
          <div className="info-card">
            <div className="info-item">
              <strong>Nom:</strong> {restaurant?.name}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {restaurant?.email}
            </div>
            <div className="info-item">
              <strong>Téléphone:</strong> {restaurant?.phone || 'Non renseigné'}
            </div>
            <div className="info-item">
              <strong>Adresse:</strong> {restaurant?.address || 'Non renseignée'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
