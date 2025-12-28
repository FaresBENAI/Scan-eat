'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Plus, Edit3, Trash2, Eye, Settings, Clock, Calendar, 
  MoreVertical, Copy, ExternalLink, QrCode, ArrowLeft, X, Save
} from 'lucide-react'
import './menus.css'

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

      {showCreateModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !saving && closeModal()}
          style={{ overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div 
            className="modal create-menu-modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh', margin: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ flexShrink: 0 }}>
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

            <form onSubmit={handleCreateMenu} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-content" style={{ flex: 1, overflowY: 'auto' }}>
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

                <div className="form-section">
                  <h3>
                    <Clock size={20} />
                    Disponibilité
                  </h3>
                  
                  <div className="time-inputs">
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

                <div className="form-section">
                  <h3>
                    <Calendar size={20} />
                    Jours de disponibilité
                  </h3>
                  
                  <div className="days-grid">
                    {daysOfWeek.map(day => (
                      <label key={day.key} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.availability_days.includes(day.key)}
                          onChange={() => handleDayToggle(day.key)}
                          disabled={saving}
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-main">
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

              <div className="modal-footer" style={{ flexShrink: 0 }}>
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
    </div>
  )
}