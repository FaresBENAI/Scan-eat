'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Package, Clock, CheckCircle, XCircle, Phone, Mail, 
  Hash, User, Calendar, Euro, Settings, ArrowLeft,
  RefreshCw, Eye, Filter, Search
} from 'lucide-react';
import './orders.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const router = useRouter();

  // États des commandes avec leurs couleurs
  const orderStatuses = {
    pending: { label: 'En attente', color: '#f39c12', icon: Clock },
    confirmed: { label: 'Confirmée', color: '#3498db', icon: CheckCircle },
    preparing: { label: 'En préparation', color: '#e67e22', icon: Package },
    ready: { label: 'Prête', color: '#27ae60', icon: CheckCircle },
    delivered: { label: 'Servie', color: '#95a5a6', icon: CheckCircle },
    cancelled: { label: 'Annulée', color: '#e74c3c', icon: XCircle }
  };

  useEffect(() => {
    loadOrders();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Charger les commandes du restaurant
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId) => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_items (
            name,
            description,
            image_url
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

    } catch (error) {
      console.error('Erreur chargement items:', error);
      setError('Erreur lors du chargement des détails');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Mettre à jour l'état local
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      // Mettre à jour l'ordre sélectionnée si c'est celle-ci
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }

    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      setError('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const getStatusButton = (order) => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return null;

    const nextStatusConfig = orderStatuses[nextStatus];
    const NextIcon = nextStatusConfig.icon;

    return (
      <button
        onClick={() => updateOrderStatus(order.id, nextStatus)}
        disabled={updatingStatus === order.id}
        className="status-update-btn"
        style={{ backgroundColor: nextStatusConfig.color }}
      >
        {updatingStatus === order.id ? (
          <RefreshCw size={16} className="spinning" />
        ) : (
          <NextIcon size={16} />
        )}
        {nextStatusConfig.label}
      </button>
    );
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  };

  const parseCustomizations = (specialInstructions) => {
    if (!specialInstructions) return null;
    
    try {
      const parsed = JSON.parse(specialInstructions);
      return parsed.customizationText || null;
    } catch {
      return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.table_number && order.table_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Header */}
      <header className="orders-header">
        <div className="header-left">
          <button 
            onClick={() => router.push('/dashboard')}
            className="back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-title">
            <h1>Gestion des Commandes</h1>
            <p>{filteredOrders.length} commande(s)</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={loadOrders} className="refresh-btn">
            <RefreshCw size={20} />
            Actualiser
          </button>
        </div>
      </header>

      {/* Filtres */}
      <div className="orders-filters">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, ID ou table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="status-filters">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`status-filter ${selectedStatus === 'all' ? 'active' : ''}`}
          >
            Toutes
          </button>
          {Object.entries(orderStatuses).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`status-filter ${selectedStatus === status ? 'active' : ''}`}
              style={{ 
                backgroundColor: selectedStatus === status ? config.color : 'transparent',
                color: selectedStatus === status ? 'white' : config.color,
                borderColor: config.color
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des commandes */}
      <main className="orders-content">
        {error && (
          <div className="error-message">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>Aucune commande</h3>
            <p>
              {searchQuery ? 
                `Aucune commande trouvée pour "${searchQuery}"` : 
                selectedStatus === 'all' ?
                  'Aucune commande reçue pour le moment' :
                  `Aucune commande ${orderStatuses[selectedStatus].label.toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => {
              const statusConfig = orderStatuses[order.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">
                      <span className="order-number">#{order.id.slice(0, 8)}</span>
                      <span className="order-time">{getTimeAgo(order.created_at)}</span>
                    </div>
                    <div 
                      className="order-status"
                      style={{ backgroundColor: statusConfig.color }}
                    >
                      <StatusIcon size={14} />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>
                  
                  <div className="order-customer">
                    <div className="customer-info">
                      <div className="customer-name">
                        <User size={16} />
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="customer-contact">
                        <Phone size={14} />
                        <span>{order.customer_phone}</span>
                      </div>
                      {order.table_number && (
                        <div className="customer-table">
                          <Hash size={14} />
                          <span>Table {order.table_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-summary">
                    <div className="order-total">
                      <Euro size={16} />
                      <span>{parseFloat(order.total_amount).toFixed(2)}€</span>
                    </div>
                    <div className="order-date">
                      <Calendar size={14} />
                      <span>{formatDate(order.created_at)} à {formatTime(order.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="order-actions">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        loadOrderItems(order.id);
                      }}
                      className="view-details-btn"
                    >
                      <Eye size={16} />
                      Détails
                    </button>
                    {getStatusButton(order)}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        disabled={updatingStatus === order.id}
                        className="cancel-btn"
                      >
                        <XCircle size={16} />
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>Commande #{selectedOrder.id.slice(0, 8)}</h2>
                <div 
                  className="modal-status"
                  style={{ backgroundColor: orderStatuses[selectedOrder.status].color }}
                >
                  {orderStatuses[selectedOrder.status].label}
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="close-modal"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="modal-customer">
                <h3>Informations client</h3>
                <div className="customer-details">
                  <div className="detail-row">
                    <User size={16} />
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  <div className="detail-row">
                    <Phone size={16} />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="detail-row">
                      <Mail size={16} />
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                  )}
                  {selectedOrder.table_number && (
                    <div className="detail-row">
                      <Hash size={16} />
                      <span>Table {selectedOrder.table_number}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span>{formatDate(selectedOrder.created_at)} à {formatTime(selectedOrder.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-items">
                <h3>Articles commandés</h3>
                <div className="items-list">
                  {orderItems.map(item => {
                    const customizations = parseCustomizations(item.special_instructions);
                    
                    return (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <h4>{item.menu_items?.name || 'Article supprimé'}</h4>
                          {customizations && (
                            <div className="item-customizations">
                              <Settings size={12} />
                              <span>{customizations}</span>
                            </div>
                          )}
                        </div>
                        <div className="item-quantity">x{item.quantity}</div>
                        <div className="item-price">{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}€</div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="modal-total">
                  <span>Total</span>
                  <span>{parseFloat(selectedOrder.total_amount).toFixed(2)}€</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              {getStatusButton(selectedOrder)}
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'cancelled');
                    setSelectedOrder(null);
                  }}
                  disabled={updatingStatus === selectedOrder.id}
                  className="cancel-btn"
                >
                  <XCircle size={16} />
                  Annuler la commande
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
