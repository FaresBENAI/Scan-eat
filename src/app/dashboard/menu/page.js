'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Edit3, Trash2, Image, Eye, EyeOff, Save, X, 
  GripVertical, ArrowLeft, Upload, AlertCircle, Move
} from 'lucide-react';
import './menu-management.css';

export default function MenuManagement() {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const router = useRouter();

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    display_order: 0
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    available: true,
    customizable: false,
    image_url: null,
    display_order: 0
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (restaurantError) {
        setError('Restaurant non trouvé');
        return;
      }

      setRestaurant(restaurantData);
      await loadMenuData(user.id);
    } catch (error) {
      console.error('Erreur auth:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuData = async (restaurantId) => {
    try {
      const mockCategories = [
        { id: 1, restaurant_id: restaurantId, name: 'Entrées', display_order: 1 },
        { id: 2, restaurant_id: restaurantId, name: 'Plats principaux', display_order: 2 },
        { id: 3, restaurant_id: restaurantId, name: 'Desserts', display_order: 3 },
        { id: 4, restaurant_id: restaurantId, name: 'Boissons', display_order: 4 }
      ];
      setCategories(mockCategories);

      const mockMenuItems = [
        {
          id: 1,
          restaurant_id: restaurantId,
          category_id: 1,
          name: 'Salade César',
          description: 'Salade romaine, croûtons, parmesan, sauce césar maison',
          price: 12.50,
          image_url: null,
          available: true,
          customizable: true,
          display_order: 1
        },
        {
          id: 2,
          restaurant_id: restaurantId,
          category_id: 2,
          name: 'Burger Classique',
          description: 'Pain brioche, steak haché, salade, tomate, oignon, sauce burger',
          price: 15.90,
          image_url: null,
          available: true,
          customizable: false,
          display_order: 1
        },
        {
          id: 3,
          restaurant_id: restaurantId,
          category_id: 3,
          name: 'Tiramisu',
          description: 'Dessert italien traditionnel au café et mascarpone',
          price: 7.50,
          image_url: null,
          available: true,
          customizable: false,
          display_order: 1
        }
      ];
      setMenuItems(mockMenuItems);
    } catch (error) {
      console.error('Erreur chargement menu:', error);
      setError('Erreur lors du chargement du menu');
    }
  };

  // Drag & Drop functions
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    // Réorganiser les items dans la même catégorie
    if (draggedItem.category_id === targetItem.category_id) {
      const categoryItems = menuItems
        .filter(item => item.category_id === draggedItem.category_id)
        .sort((a, b) => a.display_order - b.display_order);

      const draggedIndex = categoryItems.findIndex(item => item.id === draggedItem.id);
      const targetIndex = categoryItems.findIndex(item => item.id === targetItem.id);

      // Réorganiser l'ordre
      const newItems = [...categoryItems];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);

      // Mettre à jour les display_order
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        display_order: index + 1
      }));

      // Mettre à jour l'état
      setMenuItems(prev => [
        ...prev.filter(item => item.category_id !== draggedItem.category_id),
        ...updatedItems
      ]);

      setSuccess('Ordre des plats mis à jour');
    }

    setDraggedItem(null);
  };

  // Gestion des catégories
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        display_order: category.display_order
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        display_order: categories.length + 1
      });
    }
    setShowCategoryModal(true);
  };

  const saveCategoryForm = async () => {
    if (!categoryForm.name.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }

    try {
      if (editingCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...categoryForm }
            : cat
        ));
        setSuccess('Catégorie modifiée avec succès');
      } else {
        const newCategory = {
          id: Date.now(),
          restaurant_id: restaurant.id,
          ...categoryForm
        };
        setCategories(prev => [...prev, newCategory]);
        setSuccess('Catégorie ajoutée avec succès');
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', display_order: 0 });
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les plats associés seront également supprimés.')) {
      return;
    }

    try {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setMenuItems(prev => prev.filter(item => item.category_id !== categoryId));
      setSuccess('Catégorie supprimée avec succès');
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  // Gestion des plats
  const openItemModal = (item = null, categoryId = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category_id: item.category_id,
        available: item.available,
        customizable: item.customizable || false,
        image_url: item.image_url,
        display_order: item.display_order
      });
      setImagePreview(item.image_url);
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        category_id: categoryId || (categories[0]?.id || ''),
        available: true,
        customizable: false,
        image_url: null,
        display_order: menuItems.filter(item => item.category_id === categoryId).length + 1
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowItemModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const imageUrl = URL.createObjectURL(imageFile);
      return imageUrl;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const saveItemForm = async () => {
    if (!itemForm.name.trim()) {
      setError('Le nom du plat est requis');
      return;
    }
    
    if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    try {
      let imageUrl = itemForm.image_url;
      
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const itemData = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        image_url: imageUrl
      };

      if (editingItem) {
        setMenuItems(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...itemData }
            : item
        ));
        setSuccess('Plat modifié avec succès');
      } else {
        const newItem = {
          id: Date.now(),
          restaurant_id: restaurant.id,
          ...itemData
        };
        setMenuItems(prev => [...prev, newItem]);
        setSuccess('Plat ajouté avec succès');
      }
      
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        available: true,
        customizable: false,
        image_url: null,
        display_order: 0
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      return;
    }

    try {
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      setSuccess('Plat supprimé avec succès');
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  const toggleItemAvailability = async (itemId) => {
    try {
      setMenuItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, available: !item.available }
          : item
      ));
    } catch (error) {
      setError('Erreur lors de la modification');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sans catégorie';
  };

  const getItemsByCategory = (categoryId) => {
    return menuItems
      .filter(item => item.category_id === categoryId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="menu-management-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de la gestion du menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-management">
      {/* Header */}
      <header className="menu-header">
        <div className="header-content">
          <button 
            onClick={() => router.push('/dashboard')}
            className="back-btn"
          >
            <ArrowLeft size={20} />
            <span>Retour au dashboard</span>
          </button>
          
          <div className="header-info">
            <h1>Gestion du menu</h1>
            <p>Gérez vos catégories et plats • Glissez-déposez pour réorganiser</p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => openCategoryModal()}
              className="btn-secondary"
            >
              <Plus size={20} />
              <span>Nouvelle catégorie</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="message error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="message success">
          <span>{success}</span>
        </div>
      )}

      {/* Contenu principal */}
      <main className="menu-content">
        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>Aucune catégorie</h2>
            <p>Commencez par créer votre première catégorie de menu</p>
            <button 
              onClick={() => openCategoryModal()}
              className="btn-primary"
            >
              <Plus size={20} />
              Créer une catégorie
            </button>
          </div>
        ) : (
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-section">
                {/* En-tête de catégorie */}
                <div className="category-header">
                  <div className="category-info">
                    <h2>{category.name}</h2>
                    <span className="items-count">
                      {getItemsByCategory(category.id).length} plat(s)
                    </span>
                  </div>
                  
                  <div className="category-actions">
                    <button 
                      onClick={() => openItemModal(null, category.id)}
                      className="btn-add-item"
                      title="Ajouter un plat"
                    >
                      <Plus size={18} />
                    </button>
                    <button 
                      onClick={() => openCategoryModal(category)}
                      className="btn-edit"
                      title="Modifier la catégorie"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteCategory(category.id)}
                      className="btn-delete"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Liste des plats en ligne */}
                <div className="items-list">
                  {getItemsByCategory(category.id).map(item => (
                    <div 
                      key={item.id} 
                      className={`item-row ${!item.available ? 'unavailable' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item)}
                    >
                      {/* Drag handle */}
                      <div className="drag-handle">
                        <GripVertical size={20} />
                      </div>

                      {/* Image */}
                      <div className="item-image-container">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="item-image" />
                        ) : (
                          <div className="placeholder-image">
                            <Image size={24} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="item-main-content">
                        <div className="item-header">
                          <h3 className="item-name">{item.name}</h3>
                          <div className="item-badges">
                            {item.customizable && (
                              <span className="badge customizable">Personnalisable</span>
                            )}
                            <span className={`badge availability ${item.available ? 'available' : 'unavailable'}`}>
                              {item.available ? 'Disponible' : 'Indisponible'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="item-description">{item.description}</p>
                        
                        <div className="item-footer">
                          <div className="item-price">{item.price.toFixed(2)}€</div>
                          <div className="item-order">Ordre: {item.display_order}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="item-actions">
                        <button 
                          onClick={() => toggleItemAvailability(item.id)}
                          className={`availability-toggle ${item.available ? 'available' : 'unavailable'}`}
                          title={item.available ? 'Marquer indisponible' : 'Marquer disponible'}
                        >
                          {item.available ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button 
                          onClick={() => openItemModal(item)}
                          className="btn-edit"
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="btn-delete"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Bouton d'ajout de plat */}
                  <div className="add-item-row">
                    <button 
                      onClick={() => openItemModal(null, category.id)}
                      className="add-item-btn-inline"
                    >
                      <Plus size={20} />
                      <span>Ajouter un plat à "{category.name}"</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Catégorie - inchangé */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="close-btn"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="categoryName">Nom de la catégorie *</label>
                <input
                  id="categoryName"
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Entrées, Plats principaux..."
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoryOrder">Ordre d'affichage</label>
                <input
                  id="categoryOrder"
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button 
                onClick={saveCategoryForm}
                className="btn-primary"
              >
                <Save size={20} />
                {editingCategory ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Plat avec option Personnalisable */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Modifier le plat' : 'Nouveau plat'}</h2>
              <button 
                onClick={() => setShowItemModal(false)}
                className="close-btn"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="itemName">Nom du plat *</label>
                  <input
                    id="itemName"
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Salade César"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="itemPrice">Prix (€) *</label>
                  <input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.price}
                    onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="12.50"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="itemCategory">Catégorie *</label>
                <select
                  id="itemCategory"
                  value={itemForm.category_id}
                  onChange={(e) => setItemForm(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="itemDescription">Description</label>
                <textarea
                  id="itemDescription"
                  value={itemForm.description}
                  onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez les ingrédients et la préparation..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Image du plat</label>
                <div className="image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                    id="imageInput"
                  />
                  <label htmlFor="imageInput" className="image-upload-btn">
                    <Upload size={20} />
                    <span>Choisir une image</span>
                  </label>
                  
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Aperçu" />
                      <button 
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setItemForm(prev => ({ ...prev, image_url: null }));
                        }}
                        className="remove-image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-options">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={itemForm.available}
                      onChange={(e) => setItemForm(prev => ({ ...prev, available: e.target.checked }))}
                    />
                    <span>Plat disponible</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={itemForm.customizable}
                      onChange={(e) => setItemForm(prev => ({ ...prev, customizable: e.target.checked }))}
                    />
                    <span>Personnalisable par le client</span>
                  </label>
                  <small className="help-text">Le client pourra modifier des options (taille, accompagnements, etc.)</small>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowItemModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button 
                onClick={saveItemForm}
                className="btn-primary"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <div className="loading-spinner small"></div>
                ) : (
                  <Save size={20} />
                )}
                {editingItem ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
