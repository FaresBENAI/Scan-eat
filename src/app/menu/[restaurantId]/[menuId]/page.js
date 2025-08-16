'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Clock, MapPin, Phone, Plus, Minus, 
  ShoppingCart, Check, Star, Info, ChevronDown, ChevronUp
} from 'lucide-react'
import './menu-client.css'

export default function MenuClient({ params }) {
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState(null)
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const router = useRouter()
  const { restaurantId, menuId } = params

  useEffect(() => {
    loadMenuData()
  }, [restaurantId, menuId])

  const loadMenuData = async () => {
    try {
      // Charger les infos du restaurant
      const restaurantResponse = await fetch(`/api/restaurants?id=${restaurantId}`)
      const restaurantData = await restaurantResponse.json()
      
      if (!restaurantData.success) {
        setError('Restaurant non trouvé')
        return
      }
      
      setRestaurant(restaurantData.restaurant)

      // Charger le menu spécifique avec ses plats
      const menuResponse = await fetch(`/api/menus?restaurant_id=${restaurantId}&menu_id=${menuId}&include_items=true`)
      const menuData = await menuResponse.json()
      
      if (!menuData.success || !menuData.menu) {
        setError('Menu non trouvé ou indisponible')
        return
      }

      // Vérifier si le menu est actif et disponible
      if (!menuData.menu.active) {
        setError('Ce menu n\'est plus disponible')
        return
      }

      setMenu(menuData.menu)
      setCategories(menuData.menu.categories || [])

      // Étendre toutes les catégories par défaut
      const initialExpanded = {}
      menuData.menu.categories?.forEach(category => {
        initialExpanded[category.id] = true
      })
      setExpandedCategories(initialExpanded)

    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item, customizations = []) => {
    const cartItem = {
      id: `${item.id}-${Date.now()}`, // ID unique pour le panier
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity: 1,
      customizations: customizations,
      totalPrice: item.price + customizations.reduce((sum, custom) => sum + (custom.extra_price || 0), 0)
    }

    setCart(prevCart => [...prevCart, cartItem])
  }

  const updateCartItemQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const removeFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0)
  }

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const isMenuAvailable = () => {
    if (!menu?.availability_hours || !menu?.availability_days) return true
    
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5)
    
    const isDayAvailable = menu.availability_days.includes(currentDay)
    const isTimeAvailable = currentTime >= menu.availability_hours.start && 
                           currentTime <= menu.availability_hours.end
    
    return isDayAvailable && isTimeAvailable
  }

  const formatAvailability = (hours, days) => {
    if (!hours || !days || days.length === 0) {
      return '24h/7j'
    }
    
    const dayNames = {
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer',
      thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim'
    }
    
    const formattedDays = days.length === 7 
      ? '7j/7'
      : days.map(day => dayNames[day]).join(', ')
    
    return `${hours.start}-${hours.end} • ${formattedDays}`
  }

  const handleOrder = async () => {
    if (cart.length === 0) return

    try {
      // Préparer les items pour l'API
      const orderItems = cart.map(cartItem => ({
        menu_item_id: cartItem.menuItemId,
        quantity: cartItem.quantity,
        special_instructions: cartItem.customizations.map(c => c.name).join(', ')
      }))

      const orderData = {
        restaurant_id: restaurantId,
        customer_name: 'Client',
        items: orderItems,
        payment_method: 'cash'
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        alert('Commande passée avec succès !')
        setCart([])
        setShowCart(false)
      } else {
        alert('Erreur lors de la commande: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur commande:', error)
      alert('Erreur lors de la commande')
    }
  }

  if (loading) {
    return (
      <div className="menu-client-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="menu-client-error">
        <div className="error-container">
          <h1>😕 Oups !</h1>
          <p>{error}</p>
          <button 
            onClick={() => router.push(`/menu/${restaurantId}`)}
            className="btn-back"
          >
            Retour aux menus
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-client">
      {/* Header */}
      <header className="menu-client-header">
        <div className="header-content">
          <button 
            onClick={() => router.push(`/menu/${restaurantId}`)}
            className="back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="restaurant-info">
            <h1>{restaurant?.name}</h1>
            <h2>{menu?.name}</h2>
          </div>

          {/* Cart Button */}
          <button 
            className={`cart-btn ${cart.length > 0 ? 'has-items' : ''}`}
            onClick={() => setShowCart(!showCart)}
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="cart-count">{getCartItemsCount()}</span>
            )}
          </button>
        </div>

        {/* Menu Info */}
        <div className="menu-info">
          {menu?.description && (
            <p className="menu-description">{menu.description}</p>
          )}
          
          <div className="menu-availability">
            <Clock size={16} />
            <span>{formatAvailability(menu?.availability_hours, menu?.availability_days)}</span>
            {!isMenuAvailable() && (
              <span className="closed-indicator">• Fermé actuellement</span>
            )}
          </div>
        </div>
      </header>

      {/* Menu unavailable warning */}
      {!isMenuAvailable() && (
        <div className="unavailable-warning">
          <Info size={16} />
          <span>Ce menu n'est pas disponible actuellement selon ses horaires d'ouverture.</span>
        </div>
      )}

      {/* Categories and Items */}
      <main className="menu-content">
        {categories.length === 0 ? (
          <div className="empty-menu">
            <div className="empty-icon">🍽️</div>
            <h3>Menu en cours de préparation</h3>
            <p>Ce menu sera bientôt disponible avec de délicieux plats.</p>
          </div>
        ) : (
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-section">
                <div 
                  className="category-header"
                  onClick={() => toggleCategory(category.id)}
                >
                  <h3>{category.name}</h3>
                  <button className="toggle-btn">
                    {expandedCategories[category.id] ? 
                      <ChevronUp size={20} /> : 
                      <ChevronDown size={20} />
                    }
                  </button>
                </div>

                {expandedCategories[category.id] && (
                  <div className="items-grid">
                    {category.menu_items?.filter(item => item.available !== false).map(item => (
                      <div key={item.id} className="menu-item">
                        {item.image_url && (
                          <div className="item-image">
                            <img src={item.image_url} alt={item.name} />
                          </div>
                        )}
                        
                        <div className="item-content">
                          <div className="item-header">
                            <h4>{item.name}</h4>
                            <div className="item-price">
                              {parseFloat(item.price).toFixed(2)}€
                            </div>
                          </div>
                          
                          {item.description && (
                            <p className="item-description">{item.description}</p>
                          )}

                          {item.customizable && (
                            <div className="customizable-badge">
                              <Star size={14} />
                              <span>Personnalisable</span>
                            </div>
                          )}
                          
                          <button 
                            className="add-to-cart-btn"
                            onClick={() => addToCart(item)}
                            disabled={!isMenuAvailable()}
                          >
                            <Plus size={16} />
                            Ajouter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Votre commande</h3>
              <button 
                className="close-cart"
                onClick={() => setShowCart(false)}
              >
                ×
              </button>
            </div>

            <div className="cart-content">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingCart size={48} />
                  <p>Votre panier est vide</p>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <div className="cart-item-price">
                            {item.totalPrice.toFixed(2)}€
                          </div>
                        </div>
                        
                        <div className="cart-item-controls">
                          <button 
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="quantity-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="quantity-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-footer">
                    <div className="cart-total">
                      <strong>Total: {getCartTotal().toFixed(2)}€</strong>
                    </div>
                    
                    <button 
                      className="order-btn"
                      onClick={handleOrder}
                      disabled={!isMenuAvailable()}
                    >
                      <Check size={16} />
                      Commander
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Footer */}
      <footer className="menu-client-footer">
        <div className="footer-content">
          {restaurant?.address && (
            <div className="footer-item">
              <MapPin size={16} />
              <span>{restaurant.address}</span>
            </div>
          )}
          
          {restaurant?.phone && (
            <div className="footer-item">
              <Phone size={16} />
              <span>{restaurant.phone}</span>
            </div>
          )}
        </div>
        
        <div className="powered-by">
          <p>Propulsé par <strong>Scan-Eat</strong></p>
        </div>
      </footer>
    </div>
  )
}
