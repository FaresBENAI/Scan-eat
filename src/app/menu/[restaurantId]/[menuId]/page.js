'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, Plus, Minus, Phone, MapPin, Clock, 
  Star, ChefHat, X, ArrowLeft, Search, Filter, Settings,
  Check, AlertCircle, User, Mail, Hash, Info, ChevronDown, ChevronUp
} from 'lucide-react'
import './menu-client.css'

export default function MenuClient({ params }) {
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState(null)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedCategories, setExpandedCategories] = useState({})
  
  // États pour la modal de customisation
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [customizations, setCustomizations] = useState({})
  const [customizationCategories, setCustomizationCategories] = useState([])
  const [customizationOptions, setCustomizationOptions] = useState([])
  const [selectedCustomizations, setSelectedCustomizations] = useState({})
  const [customizationErrors, setCustomizationErrors] = useState({})
  const [customizationLoading, setCustomizationLoading] = useState(false)
  
  // États pour la finalisation de commande
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableNumber: ''
  })
  const [orderErrors, setOrderErrors] = useState({})
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  
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
      
      // Organiser les données pour compatibilité avec l'ancien code
      const allCategories = menuData.menu.categories || []
      const allItems = []
      
      allCategories.forEach(category => {
        if (category.menu_items) {
          category.menu_items.forEach(item => {
            allItems.push({
              ...item,
              category_id: category.id,
              category_name: category.name
            })
          })
        }
      })
      
      setCategories(allCategories)
      setMenuItems(allItems)

      // Étendre toutes les catégories par défaut
      const initialExpanded = {}
      allCategories.forEach(category => {
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

  // ====================================
  // NOUVEAU SYSTÈME DE COMPTEUR
  // ====================================

  // Obtenir la quantité totale d'un item dans le panier (tous les carts items de ce menuItemId)
  const getItemQuantity = (menuItemId) => {
    return cart
      .filter(item => item.menuItemId === menuItemId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  // Ajouter un item simple (sans customisation)
  const addSimpleItem = (item) => {
    // Chercher si l'item existe déjà dans le panier (sans customisation)
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem.menuItemId === item.id && cartItem.customizations.length === 0
    )

    if (existingItemIndex >= 0) {
      // Incrémenter la quantité
      setCart(prevCart => 
        prevCart.map((cartItem, index) => 
          index === existingItemIndex 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      )
    } else {
      // Créer un nouveau cart item
      const cartItem = {
        id: Date.now() + Math.random(),
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        image_url: item.image_url,
        quantity: 1,
        customizations: [],
        specialInstructions: '',
        totalPrice: parseFloat(item.price)
      }
      setCart(prevCart => [...prevCart, cartItem])
    }
  }

  // Retirer un item simple
  const removeSimpleItem = (item) => {
    // Chercher l'item dans le panier (sans customisation)
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem.menuItemId === item.id && cartItem.customizations.length === 0
    )

    if (existingItemIndex >= 0) {
      const currentQuantity = cart[existingItemIndex].quantity
      
      if (currentQuantity > 1) {
        // Décrémenter la quantité
        setCart(prevCart => 
          prevCart.map((cartItem, index) => 
            index === existingItemIndex 
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          )
        )
      } else {
        // Supprimer l'item du panier
        setCart(prevCart => prevCart.filter((_, index) => index !== existingItemIndex))
      }
    }
  }

  // Fonctions de gestion du panier (version complète pour customisation)
  const addToCart = (item, customizationData = null) => {
    const cartItem = {
      id: Date.now() + Math.random(),
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image_url,
      quantity: 1,
      customizations: customizationData?.selectedOptions || [],
      specialInstructions: customizationData?.specialInstructions || '',
      totalPrice: parseFloat(item.price) + (customizationData?.extraCost || 0)
    }

    setCart(prevCart => [...prevCart, cartItem])
    setCustomizationOpen(false)
    setSelectedItem(null)
    setSelectedCustomizations({})
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

  const clearCart = () => {
    setCart([])
  }

  // Fonction de customisation
  const openCustomization = async (item) => {
    if (!item.customizable) {
      addSimpleItem(item)
      return
    }

    setSelectedItem(item)
    setCustomizationLoading(true)
    setCustomizationOpen(true)

    try {
      // Charger les options de customisation depuis l'API
      const response = await fetch(`/api/menu-items/${item.id}/customizations`)
      const data = await response.json()

      if (data.success) {
        setCustomizationCategories(data.categories || [])
        setCustomizationOptions(data.options || [])
      }
    } catch (error) {
      console.error('Erreur chargement customizations:', error)
    } finally {
      setCustomizationLoading(false)
    }
  }

  // Fonctions de filtrage
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory
    const isAvailable = item.available !== false
    
    return matchesSearch && matchesCategory && isAvailable
  })

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // Fonction de commande complète
  const handleCheckout = () => {
    if (cart.length === 0) return
    if (!isMenuAvailable()) {
      alert('Ce menu n\'est pas disponible actuellement')
      return
    }
    setCheckoutOpen(true)
    setCartOpen(false)
  }

  const validateOrderForm = () => {
    const errors = {}
    
    if (!orderForm.customerName.trim()) {
      errors.customerName = 'Le nom est requis'
    }
    
    if (!orderForm.customerPhone.trim()) {
      errors.customerPhone = 'Le téléphone est requis'
    } else if (!/^[0-9+\-\s]{8,}$/.test(orderForm.customerPhone)) {
      errors.customerPhone = 'Format de téléphone invalide'
    }
    
    if (orderForm.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customerEmail)) {
      errors.customerEmail = 'Format d\'email invalide'
    }

    setOrderErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitOrder = async () => {
    if (!validateOrderForm()) return

    setOrderLoading(true)
    
    try {
      const orderData = {
        restaurant_id: restaurantId,
        menu_id: menuId,
        customer_name: orderForm.customerName,
        customer_phone: orderForm.customerPhone,
        customer_email: orderForm.customerEmail || null,
        table_number: orderForm.tableNumber || null,
        items: cart.map(item => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.price,
          customizations: item.customizations,
          special_instructions: item.specialInstructions
        })),
        total_amount: getCartTotal(),
        payment_method: 'cash'
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        setOrderSuccess({
          orderId: result.order.id,
          orderNumber: result.order.order_number,
          estimatedTime: result.order.estimated_time || '15-20 minutes'
        })
        clearCart()
        setOrderForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          tableNumber: ''
        })
      } else {
        alert('Erreur lors de la commande: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur commande:', error)
      alert('Erreur lors de la commande')
    } finally {
      setOrderLoading(false)
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

          <button 
            className={`cart-btn ${cart.length > 0 ? 'has-items' : ''}`}
            onClick={() => setCartOpen(!cartOpen)}
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

        {/* Search and Filters */}
        <div className="menu-controls">
          <div className="search-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <Filter size={16} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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

      {/* Menu Content */}
      <main className="menu-content">
        {filteredItems.length === 0 ? (
          <div className="empty-menu">
            <div className="empty-icon">🔍</div>
            <h3>Aucun plat trouvé</h3>
            <p>Essayez de modifier votre recherche ou vos filtres.</p>
          </div>
        ) : (
          <div className="categories-list">
            {categories
              .filter(category => 
                selectedCategory === 'all' || selectedCategory === category.id
              )
              .map(category => {
                const categoryItems = filteredItems.filter(item => item.category_id === category.id)
                if (categoryItems.length === 0) return null

                return (
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
                        {categoryItems.map(item => {
                          const itemQuantity = getItemQuantity(item.id)
                          
                          return (
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
                                
                                {/* NOUVEAU SYSTÈME DE COMPTEUR */}
                                {itemQuantity === 0 ? (
                                  // Bouton "Ajouter" si quantité = 0
                                  <button 
                                    className="add-to-cart-btn"
                                    onClick={() => item.customizable ? openCustomization(item) : addSimpleItem(item)}
                                    disabled={!isMenuAvailable()}
                                  >
                                    <Plus size={16} />
                                    {item.customizable ? 'Personnaliser' : 'Ajouter'}
                                  </button>
                                ) : (
                                  // Compteur +/- si quantité > 0
                                  <div className="item-counter">
                                    <button 
                                      className="counter-btn minus"
                                      onClick={() => removeSimpleItem(item)}
                                      disabled={!isMenuAvailable()}
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="counter-value">{itemQuantity}</span>
                                    <button 
                                      className="counter-btn plus"
                                      onClick={() => item.customizable ? openCustomization(item) : addSimpleItem(item)}
                                      disabled={!isMenuAvailable()}
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Votre commande</h3>
              <button 
                className="close-cart"
                onClick={() => setCartOpen(false)}
              >
                <X size={20} />
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
                          {item.customizations.length > 0 && (
                            <div className="customizations-list">
                              {item.customizations.map((custom, index) => (
                                <span key={index} className="customization-tag">
                                  {custom.name} {custom.extra_price > 0 && `(+${custom.extra_price.toFixed(2)}€)`}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.specialInstructions && (
                            <p className="special-instructions">
                              Note: {item.specialInstructions}
                            </p>
                          )}
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
                      className="checkout-btn"
                      onClick={handleCheckout}
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

      {/* Customization Modal */}
      {customizationOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="customization-modal">
            <div className="modal-header">
              <h3>Personnaliser: {selectedItem.name}</h3>
              <button 
                className="close-modal"
                onClick={() => setCustomizationOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {customizationLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <div className="item-summary">
                    <div className="item-price">
                      Prix de base: {parseFloat(selectedItem.price).toFixed(2)}€
                    </div>
                  </div>

                  {customizationCategories.map(category => (
                    <div key={category.id} className="customization-category">
                      <h4>{category.name}</h4>
                      {category.required && <span className="required">*</span>}
                      
                      <div className="customization-options">
                        {customizationOptions
                          .filter(option => option.category_id === category.id)
                          .map(option => (
                            <label key={option.id} className="customization-option">
                              <input
                                type={category.type === 'single' ? 'radio' : 'checkbox'}
                                name={`category-${category.id}`}
                                value={option.id}
                                onChange={(e) => {
                                  // Logique de sélection des customizations
                                  // À implémenter selon vos besoins
                                }}
                              />
                              <span>{option.name}</span>
                              {option.extra_price > 0 && (
                                <span className="extra-price">+{option.extra_price.toFixed(2)}€</span>
                              )}
                            </label>
                          ))
                        }
                      </div>
                    </div>
                  ))}

                  <div className="special-instructions">
                    <label>Instructions spéciales (optionnel)</label>
                    <textarea
                      placeholder="Ex: Sans oignons, bien cuit..."
                      value={selectedCustomizations.specialInstructions || ''}
                      onChange={(e) => setSelectedCustomizations(prev => ({
                        ...prev,
                        specialInstructions: e.target.value
                      }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setCustomizationOpen(false)}
              >
                Annuler
              </button>
              <button 
                className="add-customized-btn"
                onClick={() => addToCart(selectedItem, selectedCustomizations)}
                disabled={customizationLoading}
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="modal-overlay">
          <div className="checkout-modal">
            <div className="modal-header">
              <h3>Finaliser la commande</h3>
              <button 
                className="close-modal"
                onClick={() => setCheckoutOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {orderSuccess ? (
                <div className="order-success">
                  <div className="success-icon">
                    <Check size={48} />
                  </div>
                  <h3>Commande confirmée !</h3>
                  <p>Numéro de commande: #{orderSuccess.orderNumber}</p>
                  <p>Temps d'attente estimé: {orderSuccess.estimatedTime}</p>
                  <button 
                    className="close-success-btn"
                    onClick={() => {
                      setCheckoutOpen(false)
                      setOrderSuccess(null)
                    }}
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="order-summary">
                    <h4>Récapitulatif</h4>
                    {cart.map(item => (
                      <div key={item.id} className="summary-item">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{(item.totalPrice * item.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                    <div className="summary-total">
                      <strong>Total: {getCartTotal().toFixed(2)}€</strong>
                    </div>
                  </div>

                  <form className="order-form">
                    <div className="form-group">
                      <label>
                        <User size={16} />
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm(prev => ({
                          ...prev,
                          customerName: e.target.value
                        }))}
                        className={orderErrors.customerName ? 'error' : ''}
                      />
                      {orderErrors.customerName && (
                        <span className="error-message">{orderErrors.customerName}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Phone size={16} />
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={orderForm.customerPhone}
                        onChange={(e) => setOrderForm(prev => ({
                          ...prev,
                          customerPhone: e.target.value
                        }))}
                        className={orderErrors.customerPhone ? 'error' : ''}
                      />
                      {orderErrors.customerPhone && (
                        <span className="error-message">{orderErrors.customerPhone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Mail size={16} />
                        Email (optionnel)
                      </label>
                      <input
                        type="email"
                        value={orderForm.customerEmail}
                        onChange={(e) => setOrderForm(prev => ({
                          ...prev,
                          customerEmail: e.target.value
                        }))}
                        className={orderErrors.customerEmail ? 'error' : ''}
                      />
                      {orderErrors.customerEmail && (
                        <span className="error-message">{orderErrors.customerEmail}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Hash size={16} />
                        Numéro de table (optionnel)
                      </label>
                      <input
                        type="text"
                        value={orderForm.tableNumber}
                        onChange={(e) => setOrderForm(prev => ({
                          ...prev,
                          tableNumber: e.target.value
                        }))}
                      />
                    </div>
                  </form>
                </>
              )}
            </div>

            {!orderSuccess && (
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setCheckoutOpen(false)}
                  disabled={orderLoading}
                >
                  Annuler
                </button>
                <button 
                  className="submit-order-btn"
                  onClick={submitOrder}
                  disabled={orderLoading}
                >
                  {orderLoading ? 'Commande en cours...' : `Confirmer (${getCartTotal().toFixed(2)}€)`}
                </button>
              </div>
            )}
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