'use client'

import { useState, useEffect } from 'react'  // ✅ AJOUTER CETTE LIGNE si manquante
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
// ... reste des imports
import { 
  Plus, Edit3, Trash2, Eye, Settings, Clock, Calendar, 
  MoreVertical, Copy, ExternalLink, QrCode, ArrowLeft, X, Save
} from 'lucide-react'
import './dashboard.css'

export default function MenusList() {
  const [restaurant, setRestaurant] = useState(null)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Formulaire menu
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    availability_hours: { start: '12:00', end: '14:00' },
    availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    active: true
  })

  const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi', 
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ]

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Récupérer infos restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.id)
        .single()

      if (restaurantError) {
        setError('Restaurant non trouvé')
        return
      }

      setRestaurant(restaurantData)
      await loadMenus(user.id)
    } catch (error) {
      console.error('Erreur auth:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadMenus = async (restaurantId) => {
    try {
      const response = await fetch(`/api/menus?restaurant_id=${restaurantId}&include_items=true`)
      const data = await response.json()
      
      if (data.success) {
        setMenus(data.menus || [])
      } else {
        setError('Erreur chargement menus: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur chargement menus:', error)
      setError('Erreur lors du chargement')
    }
  }

  const openCreateModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu)
      setFormData({
        name: menu.name,
        description: menu.description || '',
        availability_hours: menu.availability_hours || { start: '12:00', end: '14:00' },
        availability_days: menu.availability_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        active: menu.active !== false
      })
    } else {
      setEditingMenu(null)
      setFormData({
        name: '',
        description: '',
        availability_hours: { start: '12:00', end: '14:00' },
        availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        active: true
      })
    }
    setShowCreateModal(true)
  }

  const handleCreateMenu = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Le nom du menu est requis')
      return
    }

    if (formData.availability_days.length === 0) {
      setError('Sélectionnez au moins un jour de disponibilité')
      return
    }

    if (formData.availability_hours.start >= formData.availability_hours.end) {
      setError('L\'heure de fin doit être après l\'heure de début')
      return
    }

    setSaving(true)
    try {
      const url = '/api/menus'
      const method = editingMenu ? 'PUT' : 'POST'
      const body = editingMenu 
        ? { id: editingMenu.id, restaurant_id: restaurant.id, ...formData }
        : { restaurant_id: restaurant.id, ...formData }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(editingMenu ? 'Menu modifié avec succès' : 'Menu créé avec succès')
        setShowCreateModal(false)
        setEditingMenu(null)
        await loadMenus(restaurant.id)
      } else {
        setError('Erreur: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde menu:', error)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const toggleMenuStatus = async (menuId, currentActive) => {
    try {
      const response = await fetch('/api/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: menuId,
          restaurant_id: restaurant.id,
          active: !currentActive
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMenus(menus.map(menu => 
          menu.id === menuId ? { ...menu, active: !currentActive } : menu
        ))
        setSuccess(`Menu ${!currentActive ? 'activé' : 'désactivé'}`)
      }
    } catch (error) {
      console.error('Erreur toggle menu:', error)
      setError('Erreur lors de la modification')
    }
  }

  const deleteMenu = async (menuId, menuName) => {
    if (!window.confirm(`Supprimer le menu "${menuName}" et tout son contenu ?`)) {
      return
    }

    try {
      // TODO: Implémenter DELETE dans l'API
      setError('Fonction de suppression à implémenter')
    } catch (error) {
      console.error('Erreur suppression menu:', error)
      setError('Erreur lors de la suppression')
    }
  }

  const formatAvailability = (hours, days) => {
    if (!hours || !days || days.length === 0) {
      return '24h/7j'
    }
    
    const formattedDays = days.length === 7 
      ? '7j/7'
      : days.map(day => dayNames[day]?.slice(0, 3)).join(', ')
    
    return `${hours.start}-${hours.end} • ${formattedDays}`
  }

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availability_days: prev.availability_days.includes(day)
        ? prev.availability_days.filter(d => d !== day)
        : [...prev.availability_days, day]
    }))
  }

  const handleTimeChange = (timeType, value) => {
    setFormData(prev => ({
      ...prev,
      availability_hours: {
        ...prev.availability_hours,
        [timeType]: value
      }
    }))
  }

  const getMenuStats = (menu) => {
    const categoriesCount = menu.categories?.length || 0
    const itemsCount = menu.categories?.reduce((sum, cat) => 
      sum + (cat.menu_items?.length || 0), 0
    ) || 0
    
    return { categoriesCount, itemsCount }
  }

  const copyMenuUrl = (menuId) => {
    const url = `${window.location.origin}/menu/${restaurant.id}/${menuId}`
    navigator.clipboard.writeText(url)
    setSuccess('URL du menu copiée!')
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingMenu(null)
    setFormData({
      name: '',
      description: '',
      availability_hours: { start: '12:00', end: '14:00' },
      availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      active: true
    })
  }

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  if (loading) {
    return (
      <div className="menus-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des menus...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="menus-list">
      {/* Header */}
      <header className="menus-header">
        <div className="header-content">
          <button 
            onClick={() => router.push('/dashboard')}
            className="back-btn"
          >
            <ArrowLeft size={20} />
            <span>Retour au dashboard</span>
          </button>
          
          <div className="header-info">
            <h1>Gestion des Menus</h1>
            <p>Créez et gérez plusieurs menus pour votre restaurant</p>
          </div>
          
          <button 
            className="btn-primary"
            onClick={() => openCreateModal()}
            disabled={saving}
          >
            <Plus size={20} />
            Nouveau Menu
          </button>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="message error">
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="message success">
          <span>{success}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{menus.length}</div>
          <div className="stat-label">Menus Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{menus.filter(m => m.active).length}</div>
          <div className="stat-label">Menus Actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {menus.reduce((sum, menu) => sum + (menu.categories?.length || 0), 0)}
          </div>
          <div className="stat-label">Catégories Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {menus.reduce((sum, menu) => 
              sum + menu.categories?.reduce((catSum, cat) => catSum + (cat.menu_items?.length || 0), 0) || 0, 0
            )}
          </div>
          <div className="stat-label">Plats Total</div>
        </div>
      </div>

      {/* Menus Grid */}
      <main className="menus-content">
        {menus.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>Aucun menu créé</h2>
            <p>Commencez par créer votre premier menu pour organiser vos plats</p>
            <button 
              className="btn-primary large"
              onClick={() => openCreateModal()}
              disabled={saving}
            >
              <Plus size={24} />
              Créer mon premier menu
            </button>
          </div>
        ) : (
          <div className="menus-grid">
            {menus.map(menu => {
              const { categoriesCount, itemsCount } = getMenuStats(menu)
              
              return (
                <div key={menu.id} className={`menu-card ${!menu.active ? 'inactive' : ''}`}>
                  <div className="menu-card-header">
                    <div className="menu-title">
                      <h3>{menu.name}</h3>
                      <div className="menu-status">
                        <span className={`status-badge ${menu.active ? 'active' : 'inactive'}`}>
                          {menu.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="menu-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => copyMenuUrl(menu.id)}
                        title="Copier le lien du menu"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => window.open(`/menu/${restaurant.id}/${menu.id}`, '_blank')}
                        title="Voir le menu"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => openCreateModal(menu)}
                        title="Modifier le menu"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>

                  {menu.description && (
                    <p className="menu-description">{menu.description}</p>
                  )}

                  <div className="menu-availability">
                    <Clock size={16} />
                    <span>{formatAvailability(menu.availability_hours, menu.availability_days)}</span>
                  </div>

                  <div className="menu-stats">
                    <div className="stat">
                      <span className="count">{categoriesCount}</span>
                      <span className="label">Catégories</span>
                    </div>
                    <div className="stat">
                      <span className="count">{itemsCount}</span>
                      <span className="label">Plats</span>
                    </div>
                  </div>

                  <div className="menu-footer">
                    <button 
                      className="btn-secondary"
                      onClick={() => router.push(`/dashboard/menu?menu_id=${menu.id}`)}
                    >
                      <Settings size={16} />
                      Gérer les plats
                    </button>
                    
                    <button 
                      className={`btn-toggle ${menu.active ? 'active' : 'inactive'}`}
                      onClick={() => toggleMenuStatus(menu.id, menu.active)}
                    >
                      {menu.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal Création/Edition Menu */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !saving && closeModal()}>
          <div className="modal create-menu-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Plus size={24} />
                {editingMenu ? 'Modifier le menu' : 'Nouveau menu'}
              </h2>
              <button 
                className="close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateMenu}>
              <div className="modal-content">
                {/* Nom du menu */}
                <div className="form-group">
                  <label htmlFor="menuName">Nom du menu *</label>
                  <input
                    id="menuName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Menu Midi, Menu Soir, Menu Enfant..."
                    required
                    disabled={saving}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="menuDescription">Description du menu (optionnel)</label>
                  <textarea
                    id="menuDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Décrivez ce menu..."
                    rows={3}
                    disabled={saving}
                  />
                </div>

                {/* Horaires de disponibilité */}
                <div className="form-section">
                  <h3>
                    <Clock size={20} />
                    Disponibilité
                  </h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="startTime">Heure de début</label>
                      <input
                        id="startTime"
                        type="time"
                        value={formData.availability_hours.start}
                        onChange={(e) => handleTimeChange('start', e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="endTime">Heure de fin</label>
                      <input
                        id="endTime"
                        type="time"
                        value={formData.availability_hours.end}
                        onChange={(e) => handleTimeChange('end', e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Jours de disponibilité */}
                <div className="form-section">
                  <h3>
                    <Calendar size={20} />
                    Jours de disponibilité
                  </h3>
                  
                  <div className="days-selector">
                    {daysOfWeek.map(day => (
                      <label key={day.key} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.availability_days.includes(day.key)}
                          onChange={() => handleDayToggle(day.key)}
                          disabled={saving}
                        />
                        <span className="checkbox-label">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Statut actif */}
                <div className="form-group">
                  <label className="checkbox-label main">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      disabled={saving}
                    />
                    <span>Menu actif (visible pour les clients)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner small"></div>
                      {editingMenu ? 'Modification...' : 'Création...'}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingMenu ? 'Modifier le menu' : 'Créer le menu'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .modal-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          color: #64748b;
          transition: all 0.2s;
        }

        .close-btn:hover:not(:disabled) {
          background: #e2e8f0;
          color: #374151;
        }

        .modal-content {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-section {
          margin-bottom: 32px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .form-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .days-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .day-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          transition: all 0.2s;
          background: white;
        }

        .day-checkbox:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .checkbox-label {
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .checkbox-label.main {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .btn-primary,
        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-spinner.small {
          width: 14px;
          height: 14px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .modal {
            margin: 0;
            border-radius: 0;
            max-height: 100vh;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .days-selector {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .modal-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}