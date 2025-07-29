'use client';

import React from 'react';
import { QrCode, Smartphone, CreditCard, BarChart3, Check } from 'lucide-react';
import './Homepage.css';

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Header */}
      <header className="header">
        <nav className="nav">
          <div className="nav-brand">
            <QrCode size={32} className="brand-icon" />
            <span className="brand-name">Scan-eat</span>
          </div>
          <div className="nav-buttons">
            <button className="btn-secondary">Se connecter</button>
            <button className="btn-primary">Essai gratuit</button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Révolutionnez l'expérience de vos clients avec des menus QR intelligents
          </h1>
          <p className="hero-subtitle">
            Menu digital, commande et paiement en un scan. Augmentez vos ventes et simplifiez votre service.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary-large">Démarrer gratuitement</button>
            <button className="btn-demo">Voir la démo</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="menu-preview">
                <div className="menu-header">Restaurant Demo</div>
                <div className="menu-item">
                  <div className="item-info">
                    <h4>Burger Gourmet</h4>
                    <p>Pain brioche, steak angus...</p>
                  </div>
                  <span className="item-price">15€</span>
                </div>
                <div className="menu-item">
                  <div className="item-info">
                    <h4>Salade César</h4>
                    <p>Salade romaine, parmesan...</p>
                  </div>
                  <span className="item-price">12€</span>
                </div>
                <div className="add-to-cart">
                  <button className="cart-btn">Ajouter au panier</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Comment ça marche ?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <QrCode size={48} className="feature-icon" />
              <h3>1. Créez votre menu</h3>
              <p>Ajoutez vos plats, photos et prix. Générez automatiquement votre QR code unique.</p>
            </div>
            <div className="feature-card">
              <Smartphone size={48} className="feature-icon" />
              <h3>2. Clients scannent</h3>
              <p>Vos clients scannent le QR code sur leur table pour accéder au menu instantanément.</p>
            </div>
            <div className="feature-card">
              <CreditCard size={48} className="feature-icon" />
              <h3>3. Commande & paiement</h3>
              <p>Commande et paiement sécurisé directement depuis leur téléphone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Pourquoi choisir Scan-eat ?</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <Check size={20} className="check-icon" />
                  <span>Réduction des coûts d'impression</span>
                </div>
                <div className="benefit-item">
                  <Check size={20} className="check-icon" />
                  <span>Service plus rapide</span>
                </div>
                <div className="benefit-item">
                  <Check size={20} className="check-icon" />
                  <span>Mise à jour instantanée des menus</span>
                </div>
                <div className="benefit-item">
                  <Check size={20} className="check-icon" />
                  <span>Analyses détaillées des ventes</span>
                </div>
                <div className="benefit-item">
                  <Check size={20} className="check-icon" />
                  <span>Expérience client moderne</span>
                </div>
                <div className="benefit-item">
                  <Check size={20} className="check-icon" />
                  <span>Gestion des commandes en temps réel</span>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <BarChart3 size={200} className="chart-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <h2 className="section-title">Tarifs simples et transparents</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">
                <span className="currency">€</span>
                <span className="amount">19</span>
                <span className="period">/mois</span>
              </div>
              <ul className="features-list">
                <li>Jusqu'à 50 plats</li>
                <li>QR code illimité</li>
                <li>Support email</li>
                <li>Statistiques basiques</li>
              </ul>
              <button className="btn-outline">Commencer</button>
            </div>
            <div className="pricing-card featured">
              <div className="popular-badge">Populaire</div>
              <h3>Pro</h3>
              <div className="price">
                <span className="currency">€</span>
                <span className="amount">39</span>
                <span className="period">/mois</span>
              </div>
              <ul className="features-list">
                <li>Plats illimités</li>
                <li>Personnalisation avancée</li>
                <li>Support prioritaire</li>
                <li>Analyses détaillées</li>
              </ul>
              <button className="btn-primary">Commencer</button>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">
                <span className="currency">€</span>
                <span className="amount">79</span>
                <span className="period">/mois</span>
              </div>
              <ul className="features-list">
                <li>Multi-restaurants</li>
                <li>API personnalisée</li>
                <li>Support téléphonique</li>
                <li>Formation incluse</li>
              </ul>
              <button className="btn-outline">Nous contacter</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Prêt à moderniser votre restaurant ?</h2>
          <p>Rejoignez des centaines de restaurants qui ont déjà fait le choix de l'innovation.</p>
          <button className="btn-primary-large">Démarrer gratuitement</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <QrCode size={24} />
              <span>Scan-eat</span>
            </div>
            <div className="footer-links">
              <a href="#about">À propos</a>
              <a href="#contact">Contact</a>
              <a href="#terms">CGU</a>
              <a href="#privacy">Confidentialité</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Scan-eat. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
