'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Plus, Minus, Phone, MapPin, Clock, 
  Star, ChefHat, X, ArrowLeft, Search, Filter, Settings,
  Check, AlertCircle
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
  
  // États pour la modal de customisation
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [customizationCategories, setCustomizationCategories] = useState([]);
  const [customizationOptions, setCustomizationOptions] = useState([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [customizationErrors, setCustomizationErrors] = useState({});
  const [customizationLoading, setCustomizationLoading] = useState(false);
  
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

  const loadCustomizations = async (itemId) => {
    setCustomizationLoading(true);
    try {
      // Charger les catégories de customisation
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('customization_categories')
        .select('*')
        .eq('menu_item_id', itemId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Charger les options de customisation
      const { data: optionsData, error: optionsError } = await supabase
        .from('customization_options')
        .select('*')
        .in('category_id', categoriesData.map(cat => cat.id))
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (optionsError) throw optionsError;

      setCustomizationCategories(categoriesData || []);
      setCustomizationOptions(optionsData || []);

      // Initialiser les sélections avec les options par défaut
      const initialSelections = {};
      categoriesData.forEach(category => {
        const categoryOptions = optionsData.filter(opt => opt.category_id === category.id);
        const defaultOptions = categoryOptions.filter(opt => opt.is_default);
        
        if (category.max_selections === 1) {
          // Choix unique
          initialSelections[category.id] = defaultOptions[0]?.id || null;
        } else {
          // Choix multiple
          initialSelections[category.id] = defaultOptions.map(opt => opt.id);
        }
      });

      setSelectedCustomizations(initialSelections);
      setCustomizationErrors({});

    } catch (error) {
      console.error('Erreur chargement customisations:', error);
      setError('Erreur lors du chargement des options');
    } finally {
      setCustomizationLoading(false);
    }
  };

  const handleCustomizationToggle = (categoryId, optionId, category) => {
    setSelectedCustomizations(prev => {
      const current = prev[categoryId] || (category.max_selections === 1 ? null : []);
      
      if (category.max_selections === 1) {
        // Choix unique
        return {
          ...prev,
          [categoryId]: current === optionId ? null : optionId
        };
      } else {
        // Choix multiple
        const currentArray = Array.isArray(current) ? current : [];
        const isSelected = currentArray.includes(optionId);
        
        if (isSelected) {
          return {
            ...prev,
            [categoryId]: currentArray.filter(id => id !== optionId)
          };
        } else {
          // Vérifier la limite max
          if (category.max_selections && currentArray.length >= category.max_selections) {
            return prev; // Ne pas ajouter si limite atteinte
          }
          return {
            ...prev,
            [categoryId]: [...currentArray, optionId]
          };
        }
      }
    });

    // Effacer les erreurs pour cette catégorie
    setCustomizationErrors(prev => ({
      ...prev,
      [categoryId]: null
    }));
  };

  const validateCustomizations = () => {
    const errors = {};
    let isValid = true;

    customizationCategories.forEach(category => {
      const selections = selectedCustomizations[category.id];
      const selectionCount = category.max_selections === 1 
        ? (selections ? 1 : 0)
        : (Array.isArray(selections) ? selections.length : 0);

      // Vérifier minimum requis
      if (category.is_required && selectionCount < category.min_selections) {
        errors[category.id] = `Veuillez sélectionner au moins ${category.min_selections} option(s)`;
        isValid = false;
      }

      // Vérifier maximum (normalement géré par l'interface, mais sécurité)
      if (category.max_selections && selectionCount > category.max_selections) {
        errors[category.id] = `Maximum ${category.max_selections} option(s) autorisée(s)`;
        isValid = false;
      }
    });

    setCustomizationErrors(errors);
    return isValid;
  };

  const calculateCustomizationPrice = () => {
    let extraPrice = 0;

    Object.entries(selectedCustomizations).forEach(([categoryId, selections]) => {
      const category = customizationCategories.find(cat => cat.id === categoryId);
      if (!category) return;

      if (category.max_selections === 1) {
        // Choix unique
        if (selections) {
          const option = customizationOptions.find(opt => opt.id === selections);
          if (option) {
            extraPrice += parseFloat(option.extra_price || 0);
          }
        }
      } else {
        // Choix multiple
        if (Array.isArray(selections)) {
          selections.forEach(optionId => {
            const option = customizationOptions.find(opt => opt.id === optionId);
            if (option) {
              extraPrice += parseFloat(option.extra_price || 0);
            }
          });
        }
      }
    });

    return extraPrice;
  };

  const getSelectedOptionsText = () => {
    const texts = [];

    Object.entries(selectedCustomizations).forEach(([categoryId, selections]) => {
      const category = customizationCategories.find(cat => cat.id === categoryId);
      if (!category) return;

      if (category.max_selections === 1) {
        if (selections) {
          const option = customizationOptions.find(opt => opt.id === selections);
          if (option) {
            texts.push(`${category.name}: ${option.name}`);
          }
        }
      } else {
        if (Array.isArray(selections) && selections.length > 0) {
          const optionNames = selections.map(optionId => {
            const option = customizationOptions.find(opt => opt.id === optionId);
            return option ? option.name : '';
          }).filter(Boolean);
          
          if (optionNames.length > 0) {
            texts.push(`${category.name}: ${optionNames.join(', ')}`);
          }
        }
      }
    });

    return texts.join(' • ');
  };

  const handleAddToCart = (item) => {
    if (item.customizable) {
      setSelectedItem(item);
      setCustomizationOpen(true);
      loadCustomizations(item.id);
    } else {
      // Ajouter directement au panier
      addToCart(item);
    }
  };

  const handleCustomizedAddToCart = () => {
    if (!validateCustomizations()) {
      return;
    }

    const extraPrice = calculateCustomizationPrice();
    const customizedItem = {
      ...selectedItem,
      price: parseFloat(selectedItem.price) + extraPrice,
      originalPrice: parseFloat(selectedItem.price),
      extraPrice: extraPrice,
      customizations: { ...selectedCustomizations },
      customizationText: getSelectedOptionsText()
    };

    addToCart(customizedItem);
    setCustomizationOpen(false);
    setSelectedItem(null);
    setSelectedCustomizations({});
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      // Pour les items personnalisés, créer un ID unique basé sur les customisations
      const itemKey = item.customizations 
        ? `${item.id}_${JSON.stringify(item.customizations)}`
        : item.id;

      const existingItem = prevCart.find(cartItem => 
        cartItem.customizations 
          ? `${cartItem.id}_${JSON.stringify(cartItem.customizations)}` === itemKey
          : cartItem.id === itemKey
      );

      if (existingItem) {
        return prevCart.map(cartItem =>
          (cartItem.customizations 
            ? `${cartItem.id}_${JSON.stringify(cartItem.customizations)}` === itemKey
            : cartItem.id === itemKey)
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1, itemKey }];
    });
  };

  const removeFromCart = (itemKey) => {
    setCart(prevCart => {
      return prevCart.map(cartItem =>
        cartItem.itemKey === itemKey
          ? { ...cartItem, quantity: Math.max(0, cartItem.quantity - 1) }
          : cartItem
      ).filter(cartItem => cartItem.quantity > 0);
    });
  };

  const getItemQuantity = (itemId) => {
    const items = cart.filter(cartItem => cartItem.id === itemId);
    return items.reduce((total, item) => total + item.quantity, 0);
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
                        onClick={() => handleAddToCart(item)}
                        className="add-btn"
                      >
                        <Plus size={20} />
                        {item.customizable ? 'Personnaliser' : 'Ajouter'}
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
                          onClick={() => handleAddToCart(item)}
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

      {/* Customization Modal */}
      {customizationOpen && selectedItem && (
        <div className="customization-overlay" onClick={() => setCustomizationOpen(false)}>
          <div className="customization-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customization-header">
              <div className="customization-title">
                <h2>Personnaliser</h2>
                <h3>{selectedItem.name}</h3>
              </div>
              <button 
                onClick={() => setCustomizationOpen(false)}
                className="close-customization"
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="customization-content">
              {customizationLoading ? (
                <div className="customization-loading">
                  <div className="loading-spinner"></div>
                  <p>Chargement des options...</p>
                </div>
              ) : (
                <div className="customization-categories">
                  {customizationCategories.map(category => {
                    const categoryOptions = customizationOptions.filter(opt => opt.category_id === category.id);
                    const selections = selectedCustomizations[category.id];
                    const selectionCount = category.max_selections === 1 
                      ? (selections ? 1 : 0)
                      : (Array.isArray(selections) ? selections.length : 0);

                    return (
                      <div key={category.id} className="customization-category">
                        <div className="category-header">
                          <h4>{category.name}</h4>
                          <div className="category-rules">
                            {category.is_required && (
                              <span className="rule-badge required">Obligatoire</span>
                            )}
                            {!category.is_required && (
                              <span className="rule-badge optional">Optionnel</span>
                            )}
                            {category.max_selections === 1 ? (
                              <span className="rule-badge">Choix unique</span>
                            ) : (
                              <span className="rule-badge">
                                {category.max_selections ? `Max ${category.max_selections}` : 'Illimité'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {category.description && (
                          <p className="category-description">{category.description}</p>
                        )}

                        {customizationErrors[category.id] && (
                          <div className="customization-error">
                            <AlertCircle size={16} />
                            <span>{customizationErrors[category.id]}</span>
                          </div>
                        )}
                        
                        <div className="category-options">
                          {categoryOptions.map(option => {
                            const isSelected = category.max_selections === 1 
                              ? selections === option.id
                              : Array.isArray(selections) && selections.includes(option.id);
                            
                            const isDisabled = !isSelected && category.max_selections && 
                              category.max_selections > 1 && selectionCount >= category.max_selections;

                            return (
                              <button
                                key={option.id}
                                onClick={() => handleCustomizationToggle(category.id, option.id, category)}
                                disabled={isDisabled}
                                className={`customization-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                              >
                                <div className="option-check">
                                  {isSelected && <Check size={16} />}
                                </div>
                                <div className="option-content">
                                  <div className="option-name">{option.name}</div>
                                  {option.description && (
                                    <div className="option-description">{option.description}</div>
                                  )}
                                </div>
                                {option.extra_price > 0 && (
                                  <div className="option-price">+{parseFloat(option.extra_price).toFixed(2)}€</div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="customization-footer">
              <div className="price-summary">
                <div className="base-price">
                  <span>Prix de base</span>
                  <span>{parseFloat(selectedItem.price).toFixed(2)}€</span>
                </div>
                {calculateCustomizationPrice() > 0 && (
                  <div className="extra-price">
                    <span>Suppléments</span>
                    <span>+{calculateCustomizationPrice().toFixed(2)}€</span>
                  </div>
                )}
                <div className="total-price">
                  <span>Total</span>
                  <span>{(parseFloat(selectedItem.price) + calculateCustomizationPrice()).toFixed(2)}€</span>
                </div>
              </div>
              <button 
                onClick={handleCustomizedAddToCart}
                className="add-to-cart-btn"
                disabled={customizationLoading}
              >
                <Plus size={20} />
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
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
                <div key={item.itemKey || item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-price">{parseFloat(item.price).toFixed(2)}€</span>
                    {item.customizations && item.customizationText && (
                      <div className="cart-item-customizations">
                        <Settings size={12} />
                        <span>{item.customizationText}</span>
                      </div>
                    )}
                    {!item.customizations && item.customizable && (
                      <div className="cart-item-customizable">
                        <Settings size={12} />
                        <span>Personnalisable</span>
                      </div>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <button 
                      onClick={() => removeFromCart(item.itemKey || item.id)}
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
