'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ShoppingCart, Plus, Minus, MapPin, Phone } from 'lucide-react';

export default function MenuClient({ restaurantId }) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      // Charger les données du restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError && categoriesError.code !== 'PGRST116') throw categoriesError;
      setCategories(categoriesData || []);

      // Charger les plats
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('display_order');

      if (menuError && menuError.code !== 'PGRST116') throw menuError;
      setMenuItems(menuData || []);

    } catch (error) {
      console.error('Erreur chargement:', error);
      setError('Restaurant introuvable ou menu indisponible');
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
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const getCartItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="menu-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-error">
        <h1>Erreur</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="menu-error">
        <h1>Restaurant non trouvé</h1>
        <p>Ce restaurant n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Header Restaurant */}
      <header className="restaurant-header">
        <div className="restaurant-info">
          <h1>{restaurant.name}</h1>
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
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="menu-content">
        {categories.length === 0 && menuItems.length === 0 ? (
          <div className="empty-menu">
            <h2>Menu en préparation</h2>
            <p>Ce restaurant n'a pas encore ajouté ses plats. Revenez bientôt !</p>
          </div>
        ) : (
          <div className="menu-sections">
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => item.category_id === category.id);
              if (categoryItems.length === 0) return null;

              return (
                <section key={category.id} className="menu-section">
                  <h2 className="category-title">{category.name}</h2>
                  <div className="menu-items">
                    {categoryItems.map(item => (
                      <div key={item.id} className="menu-item">
                        <div className="item-info">
                          <h3>{item.name}</h3>
                          {item.description && <p>{item.description}</p>}
                          <div className="item-price">{item.price.toFixed(2)}€</div>
                        </div>
                        <div className="item-actions">
                          {getCartItemQuantity(item.id) > 0 ? (
                            <div className="quantity-controls">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="quantity-btn"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="quantity">{getCartItemQuantity(item.id)}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="quantity-btn"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="add-btn"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Items sans catégorie */}
            {menuItems.filter(item => !item.category_id).length > 0 && (
              <section className="menu-section">
                <h2 className="category-title">Nos plats</h2>
                <div className="menu-items">
                  {menuItems
                    .filter(item => !item.category_id)
                    .map(item => (
                      <div key={item.id} className="menu-item">
                        <div className="item-info">
                          <h3>{item.name}</h3>
                          {item.description && <p>{item.description}</p>}
                          <div className="item-price">{item.price.toFixed(2)}€</div>
                        </div>
                        <div className="item-actions">
                          {getCartItemQuantity(item.id) > 0 ? (
                            <div className="quantity-controls">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="quantity-btn"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="quantity">{getCartItemQuantity(item.id)}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="quantity-btn"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="add-btn"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <div className="floating-cart">
          <button className="cart-button">
            <ShoppingCart size={20} />
            <span className="cart-count">{getTotalItems()}</span>
            <span className="cart-total">{getTotalPrice().toFixed(2)}€</span>
          </button>
        </div>
      )}
    </div>
  );
}
