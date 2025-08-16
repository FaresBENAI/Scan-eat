'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Calendar, Users, ArrowRight, MapPin, Phone, Star } from 'lucide-react'
import './menu-selector.css'

export default function MenuSelector({ params }) {
  const [restaurant, setRestaurant] = useState(null)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { restaurantId } = params

  useEffect(() => {
    loadRestaurantAndMenus()
  }, [restaurantId])

  const loadRestaurantAndMenus = async () => {
    try {
      // Charger les infos du restaurant
      const restaurantResponse = await fetch(`/api/restaurants?id=${restaurantId}`)
      const restaurantData = await restaurantResponse.json()
      
      if (!restaurantData.success) {
        setError('Restaurant non trouvé')
        return
      }
      
      setRestaurant(restaurantData.restaurant)

      // Charger les menus disponibles
      const menusResponse = await fetch(`/api/menus?restaurant_id=${restaurantId}&include_items=true`)
      const menusData = await menusResponse.json()
      
      if (menusData.success) {
        // Filtrer les menus actifs et disponibles selon l'horaire
        const availableMenus = menusData.menus.filter(menu => {
          if (!menu.active) return false
          
          // Vérifier la disponibilité horaire
          if (menu.availability_hours && menu.availability_days) {
            const now = new Date()
            const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
            const currentTime = now.toTimeString().slice(0, 5) // 'HH:MM'
            
            if (!menu.availability_days.includes(currentDay)) return false
            
            if (currentTime < menu.availability_hours.start || currentTime > menu.availability_hours.end) {
              return false
            }
          }
          
          return true
        })
        
        setMenus(availableMenus)
        
        // Si un seul menu disponible, redirection automatique après 2 secondes
        if (availableMenus.length === 1) {
          setTimeout(() => {
            router.push(`/menu/${restaurantId}/${availableMenus[0].id}`)
          }, 2000)
        }
      } else {
        setError('Erreur chargement des menus')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const selectMenu = (menuId) => {
    router.push(`/menu/${restaurantId}/${menuId}`)
  }

  const formatAvailability = (hours, days) => {
    if (!hours || !days || days.length === 0) {
      return '24h/7j'
    }
    
    const dayNames = {
      monday: 'Lun',
      tuesday: 'Mar', 
      wednesday: 'Mer',
      thursday: 'Jeu',
      friday: 'Ven',
      saturday: 'Sam',
      sunday: 'Dim'
    }
    
    const formattedDays = days.length === 7 
      ? '7j/7'
      : days.map(day => dayNames[day]).join(', ')
    
    return `${hours.start}-${hours.end} • ${formattedDays}`
  }

  const getMenuStats = (menu) => {
    const categoriesCount = menu.categories?.length || 0
    const itemsCount = menu.categories?.reduce((sum, cat) => 
      sum + (cat.menu_items?.length || 0), 0
    ) || 0
    
    return { categoriesCount, itemsCount }
  }

  const isMenuAvailableNow = (menu) => {
    if (!menu.availability_hours || !menu.availability_days) return true
    
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5)
    
    const isDayAvailable = menu.availability_days.includes(currentDay)
    const isTimeAvailable = currentTime >= menu.availability_hours.start && 
                           currentTime <= menu.availability_hours.end
    
    return isDayAvailable && isTimeAvailable
  }

  if (loading) {
    return (
      <div className="menu-selector-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des menus...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="menu-selector-error">
        <div className="error-container">
          <h1>😕 Oups !</h1>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-retry"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="menu-selector-error">
        <div className="error-container">
          <h1>🏪 Restaurant introuvable</h1>
          <p>Ce restaurant n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-selector">
      {/* Header Restaurant */}
      <header className="restaurant-header">
        <div className="restaurant-hero">
          <div className="restaurant-info">
            <h1 className="restaurant-name">{restaurant.name}</h1>
            
            {restaurant.description && (
              <p className="restaurant-description">{restaurant.description}</p>
            )}
            
            <div className="restaurant-details">
              {restaurant.address && (
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{restaurant.address}</span>
                </div>
              )}
              
              {restaurant.phone && (
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{restaurant.phone}</span>
                </div>
              )}
              
              {restaurant.cuisine_type && (
                <div className="detail-item">
                  <Star size={16} />
                  <span>{restaurant.cuisine_type}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Menu Selection */}
      <main className="menu-selection">
        <div className="selection-header">
          <h2>Choisissez votre menu</h2>
          <p>Sélectionnez le menu qui vous intéresse</p>
        </div>

        {menus.length === 0 ? (
          <div className="no-menus">
            <div className="no-menus-icon">🍽️</div>
            <h3>Aucun menu disponible</h3>
            <p>Tous les menus sont actuellement fermés ou indisponibles.</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-refresh"
            >
              Actualiser
            </button>
          </div>
        ) : menus.length === 1 ? (
          <div className="single-menu">
            <div className="auto-redirect">
              <div className="redirect-spinner"></div>
              <h3>Redirection automatique...</h3>
              <p>Vous allez être redirigé vers le menu "{menus[0].name}"</p>
            </div>
          </div>
        ) : (
          <div className="menus-list">
            {menus.map(menu => {
              const { categoriesCount, itemsCount } = getMenuStats(menu)
              const isAvailable = isMenuAvailableNow(menu)
              
              return (
                <div 
                  key={menu.id} 
                  className={`menu-option ${!isAvailable ? 'unavailable' : ''}`}
                  onClick={() => isAvailable && selectMenu(menu.id)}
                >
                  <div className="menu-content">
                    <div className="menu-header">
                      <h3 className="menu-name">{menu.name}</h3>
                      <div className="menu-status">
                        {isAvailable ? (
                          <span className="status-available">Disponible</span>
                        ) : (
                          <span className="status-unavailable">Fermé</span>
                        )}
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
                        <span className="label">catégories</span>
                      </div>
                      <div className="stat">
                        <span className="count">{itemsCount}</span>
                        <span className="label">plats</span>
                      </div>
                    </div>

                    {/* Preview des catégories */}
                    {menu.categories && menu.categories.length > 0 && (
                      <div className="categories-preview">
                        <div className="categories-list">
                          {menu.categories.slice(0, 4).map(category => (
                            <span key={category.id} className="category-tag">
                              {category.name}
                            </span>
                          ))}
                          {menu.categories.length > 4 && (
                            <span className="category-tag more">
                              +{menu.categories.length - 4} autres
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isAvailable && (
                    <div className="menu-action">
                      <ArrowRight size={20} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="menu-selector-footer">
        <div className="footer-content">
          <p>Propulsé par <strong>Scan-Eat</strong></p>
          <div className="footer-links">
            <span>Menu digital</span>
            <span>•</span>
            <span>Commande rapide</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
