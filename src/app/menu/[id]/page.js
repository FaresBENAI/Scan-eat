'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Plus, Minus, Phone, MapPin, Clock, 
  Star, ChefHat, X, ArrowLeft, Search, Filter, Settings
} from 'lucide-react';
import './menu.css';

export default function MenuPage({ params }) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  useEffect(() => {
    loadRestaurantData();
  }, [params.id]);

  const loadRestaurantData = async () => {
    try {
      // Charger les données du restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', params.id)
        .single();

      if (restaurantError) {
        setError('Restaurant non trouvé');
        return;
      }

      setRestaurant(restaurantData);

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', params.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Ajouter la catégorie "Tout voir"
      const allCategories = [
        { id: 'all', name: 'Tout voir', display_order: 0 },
        ...(categoriesData || [])
      ];
      setCategories(allCategories);

      // Charger les plats disponibles
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', params.id)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);

    } catch (error) {
      console.error('Erreur chargement:', error);
      setError('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      return prevCart.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: Math.max(0, cartItem.quantity - 1) }
          : cartItem
      ).filter(cartItem => cartItem.quantity > 0);
    });
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sans catégorie';
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="menu-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-error">
        <div className="error-container">
          <div className="error-icon">
            <ChefHat size={48} />
          </div>
          <h1>Oops !</h1>
          <p>{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            <ArrowLeft size={20} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Header Restaurant */}
      <header className="restaurant-header">
        <div className="header-background"></div>
        <div className="header-content">
          <button 
            onClick={() => router.back()} 
            className="back-btn"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="restaurant-info">
            <div className="restaurant-main">
              <h1>{restaurant.name}</h1>
              <div className="restaurant-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < 4 ? 'filled' : ''} />
                  ))}
                </div>
                <span>4.2 (127 avis)</span>
              </div>
            </div>
            
            <div className="restaurant-details">
              {restaurant.phone && (
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{restaurant.phone}</span>
                </div>
              )}
              {restaurant.address && (
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{restaurant.address}</span>
                </div>
              )}
              <div className="detail-item">
                <Clock size={16} />
                <span>Ouvert jusqu'à 22h30</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="menu-filters">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="categories-filter">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      <main className="menu-content">
        {filteredMenuItems.length === 0 ? (
          <div className="empty-state">
            <ChefHat size={48} />
            <h3>Aucun plat trouvé</h3>
            <p>
              {searchQuery ? 
                `Aucun résultat pour "${searchQuery}"` : 
                'Aucun plat disponible dans cette catégorie'
              }
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredMenuItems.map(item => (
              <div key={item.id} className="menu-item">
                <div className="item-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className="placeholder-image">
                      <ChefHat size={32} />
                    </div>
                  )}
                  {item.customizable && (
                    <div className="customizable-badge">
                      <Settings size={14} />
                      <span>Personnalisable</span>
                    </div>
                  )}
                </div>
                
                <div className="item-content">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="item-meta">
                      <div className="item-price">{parseFloat(item.price).toFixed(2)}€</div>
                      <div className="item-category">{getCategoryName(item.category_id)}</div>
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    {getItemQuantity(item.id) === 0 ? (
                      <button 
                        onClick={() => addToCart(item)}
                        className="add-btn"
                      >
                        <Plus size={20} />
                        Ajouter
                      </button>
                    ) : (
                      <div className="quantity-controls">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="quantity-btn"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="quantity">{getItemQuantity(item.id)}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="quantity-btn"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <button 
          onClick={() => setCartOpen(true)}
          className="floating-cart"
          aria-label={`Panier avec ${getTotalItems()} articles`}
        >
          <div className="cart-content">
            <div className="cart-icon">
              <ShoppingCart size={24} />
              <span className="cart-badge">{getTotalItems()}</span>
            </div>
            <div className="cart-info">
              <span className="cart-text">Voir le panier</span>
              <span className="cart-total">{getTotalPrice().toFixed(2)}€</span>
            </div>
          </div>
        </button>
      )}

      {/* Cart Modal */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Votre commande</h2>
              <button 
                onClick={() => setCartOpen(false)}
                className="close-cart"
                aria-label="Fermer le panier"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-price">{parseFloat(item.price).toFixed(2)}€</span>
                    {item.customizable && (
                      <div className="cart-item-customizable">
                        <Settings size={12} />
                        <span>Personnalisable</span>
                      </div>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="cart-quantity-btn"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="cart-quantity">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="cart-quantity-btn"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-footer">
              <div className="cart-total-section">
                <div className="total-line">
                  <span>Total</span>
                  <span className="total-amount">{getTotalPrice().toFixed(2)}€</span>
                </div>
              </div>
              <button className="checkout-btn">
                Passer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
