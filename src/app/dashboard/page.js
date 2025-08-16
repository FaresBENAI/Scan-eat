'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Menu, Users, ShoppingBag, CreditCard, Settings, 
  BarChart3, QrCode, Plus, ArrowRight, Eye,
  Clock, TrendingUp, DollarSign
} from 'lucide-react'
import './dashboard.css'

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Charger les infos du restaurant avec stats
      const response = await fetch(`/api/restaurants?id=${user.id}&include_stats=true`)
      const data = await response.json()
      
      if (data.success) {
        setRestaurant(data.restaurant)
        setStats(data.stats)
      } else {
        setError('Erreur chargement données')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Erreur déconnexion:', error)
    } else {
      router.push('/auth/login')
    }
  }

  const copyQRUrl = () => {
    const url = `${window.location.origin}/menu/${restaurant.id}`
    navigator.clipboard.writeText(url)
    alert('URL du menu copiée !')
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <h1>Erreur</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="restaurant-info">
            <h1>Bienvenue, {restaurant?.name}</h1>
            <p>Gérez votre restaurant depuis votre tableau de bord</p>
          </div>
          
          <div className="header-actions">
            <button onClick={copyQRUrl} className="btn-qr">
              <QrCode size={20} />
              Copier URL Menu
            </button>
            <button onClick={handleLogout} className="btn-logout">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Menu size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.categories?.total || 0}</div>
              <div className="stat-label">Catégories</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.menuItems?.total || 0}</div>
              <div className="stat-label">Plats au menu</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.orders?.total30Days || 0}</div>
              <div className="stat-label">Commandes (30j)</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{(stats.orders?.revenue30Days || 0).toFixed(0)}€</div>
              <div className="stat-label">Chiffre d'affaires</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <main className="dashboard-main">
        <div className="actions-grid">
          {/* NOUVEAU: Bouton Gestion des Menus */}
          <div className="action-card featured">
            <div className="action-header">
              <div className="action-icon">
                <Menu size={32} />
              </div>
              <div className="action-content">
                <h3>Gestion des Menus</h3>
                <p>Créez et gérez plusieurs menus pour votre restaurant</p>
              </div>
            </div>
            <div className="action-features">
              <div className="feature">
                <Clock size={16} />
                <span>Horaires personnalisés</span>
              </div>
              <div className="feature">
                <Plus size={16} />
                <span>Menus multiples</span>
              </div>
              <div className="feature">
                <Settings size={16} />
                <span>Personnalisation avancée</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/menus')}
              className="action-btn primary"
            >
              <span>Gérer les menus</span>
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Gestion des Plats (modifié) */}
          <div className="action-card">
            <div className="action-header">
              <div className="action-icon">
                <ShoppingBag size={28} />
              </div>
              <div className="action-content">
                <h3>Gestion des Plats</h3>
                <p>Ajoutez et modifiez vos plats et catégories</p>
              </div>
            </div>
            <div className="action-stats">
              <div className="stat">
                <span className="stat-value">{stats?.menuItems?.available || 0}</span>
                <span className="stat-label">Disponibles</span>
              </div>
              <div className="stat">
                <span className="stat-value">{stats?.menuItems?.unavailable || 0}</span>
                <span className="stat-label">Indisponibles</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/menus')}
              className="action-btn secondary"
            >
              <span>Voir les menus</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Gestion des Commandes */}
          <div className="action-card">
            <div className="action-header">
              <div className="action-icon">
                <Users size={28} />
              </div>
              <div className="action-content">
                <h3>Commandes</h3>
                <p>Suivez et gérez les commandes en temps réel</p>
              </div>
            </div>
            <div className="action-stats">
              <div className="stat">
                <span className="stat-value">{stats?.orders?.pending || 0}</span>
                <span className="stat-label">En attente</span>
              </div>
              <div className="stat">
                <span className="stat-value">{stats?.orders?.completed30Days || 0}</span>
                <span className="stat-label">Terminées</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/orders')}
              className="action-btn secondary"
            >
              <span>Voir les commandes</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* QR Code et Partage */}
          <div className="action-card">
            <div className="action-header">
              <div className="action-icon">
                <QrCode size={28} />
              </div>
              <div className="action-content">
                <h3>Menu QR Code</h3>
                <p>Partagez votre menu via QR code</p>
              </div>
            </div>
            <div className="qr-preview">
              <div className="qr-placeholder">
                <QrCode size={48} />
              </div>
              <p>Menu digital accessible</p>
            </div>
            <div className="action-buttons">
              <button onClick={copyQRUrl} className="action-btn secondary">
                <span>Copier le lien</span>
              </button>
              <button 
                onClick={() => window.open(`/menu/${restaurant?.id}`, '_blank')}
                className="action-btn secondary"
              >
                <Eye size={16} />
                <span>Aperçu</span>
              </button>
            </div>
          </div>

          {/* Analytics */}
          <div className="action-card">
            <div className="action-header">
              <div className="action-icon">
                <BarChart3 size={28} />
              </div>
              <div className="action-content">
                <h3>Statistiques</h3>
                <p>Analysez les performances de votre restaurant</p>
              </div>
            </div>
            <div className="action-stats">
              <div className="stat">
                <span className="stat-value">{(stats?.performance?.averageOrderValue || 0).toFixed(1)}€</span>
                <span className="stat-label">Panier moyen</span>
              </div>
              <div className="stat">
                <span className="stat-value">{stats?.performance?.ordersToday || 0}</span>
                <span className="stat-label">Aujourd'hui</span>
              </div>
            </div>
            <button className="action-btn secondary">
              <span>Voir les stats</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Paramètres */}
          <div className="action-card">
            <div className="action-header">
              <div className="action-icon">
                <Settings size={28} />
              </div>
              <div className="action-content">
                <h3>Paramètres</h3>
                <p>Configurez votre restaurant et votre compte</p>
              </div>
            </div>
            <div className="settings-list">
              <div className="setting-item">
                <span>Informations restaurant</span>
              </div>
              <div className="setting-item">
                <span>Préférences</span>
              </div>
              <div className="setting-item">
                <span>Facturation</span>
              </div>
            </div>
            <button className="action-btn secondary">
              <span>Paramètres</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* Quick Stats Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="quick-stat">
            <TrendingUp size={20} />
            <span>Scan-Eat Dashboard</span>
          </div>
          <div className="quick-stat">
            <Clock size={20} />
            <span>Dernière mise à jour: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
