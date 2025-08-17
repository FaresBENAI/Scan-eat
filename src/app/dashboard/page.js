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

  const generateAndShowQR = () => {
    const menuUrl = `${window.location.origin}/menu/${restaurant.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&margin=20`
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code Menu - ${restaurant.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #333;
              padding: 30px;
              border-radius: 10px;
              background: white;
            }
            .restaurant-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #333;
            }
            .qr-image {
              margin: 20px 0;
            }
            .instruction {
              font-size: 16px;
              color: #666;
              margin-top: 15px;
            }
            .url {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
              word-break: break-all;
            }
            .print-btn {
              margin-top: 20px;
              padding: 10px 20px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
              .print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="restaurant-name">${restaurant.name}</div>
            <div class="qr-image">
              <img src="${qrUrl}" alt="QR Code Menu" style="width: 250px; height: 250px;" />
            </div>
            <div class="instruction">
              📱 Scannez pour voir nos menus
            </div>
            <div class="url">${menuUrl}</div>
            <button class="print-btn" onclick="window.print()">Imprimer ce QR Code</button>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const downloadQR = () => {
    const menuUrl = `${window.location.origin}/menu/${restaurant.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}&margin=20&format=png`
    
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-menu-${restaurant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          {/* Gestion des Menus */}
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

          {/* Gestion des Plats */}
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

          {/* QR Code et Partage - SECTION AMÉLIORÉE */}
          <div className="action-card qr-card">
            <div className="action-header">
              <div className="action-icon">
                <QrCode size={28} />
              </div>
              <div className="action-content">
                <h3>QR Code Menu</h3>
                <p>Partagez vos menus via QR code</p>
              </div>
            </div>
            <div className="qr-preview">
              {restaurant && (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/menu/' + restaurant.id)}&margin=10`}
                  alt="QR Code Menu"
                  style={{
                    width: '120px',
                    height: '120px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                  }}
                />
              )}
              <p>Sélection de menus</p>
            </div>
            <div className="action-buttons qr-buttons">
              <button onClick={copyQRUrl} className="action-btn secondary">
                <span>Copier le lien</span>
              </button>
              <button onClick={downloadQR} className="action-btn secondary">
                <QrCode size={16} />
                <span>Télécharger</span>
              </button>
              <button onClick={generateAndShowQR} className="action-btn secondary">
                <span>Imprimer QR</span>
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