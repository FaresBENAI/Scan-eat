'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, CreditCard, BarChart3, Check, Menu, X } from 'lucide-react';
import Link from 'next/link';
import './Homepage.css';

const Homepage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="homepage">
      {/* Header */}
      <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
        <nav className="nav">
          <div className="nav-brand">
            <QrCode size={32} className="brand-icon" />
            <span className="brand-name">Scan-eat</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="nav-buttons desktop-nav">
            <Link href="/auth/login">
              <button className="btn-secondary">Se connecter</button>
            </Link>
            <Link href="/auth/register">
              <button className="btn-primary">Essai gratuit</button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
            <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="btn-secondary mobile-btn">Se connecter</button>
            </Link>
            <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="btn-primary mobile-btn">Essai gratuit</button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Révolutionnez l'expérience de vos clients avec des menus QR intelligents
            </h1>
            <p className="hero-subtitle">
              Menu digital, commande et paiement en un scan. Augmentez vos ventes et simplifiez votre service.
            </p>
            <div className="hero-buttons">
              <Link href="/auth/register">
                <button className="btn-primary-large">Démarrer gratuitement</button>
              </Link>
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
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Comment ça marche ?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <QrCode size={48} className="feature-icon" />
              </div>
              <h3>1. Créez votre menu</h3>
              <p>Ajoutez vos plats, photos et prix. Générez automatiquement votre QR code unique.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Smartphone size={48} className="feature-icon" />
              </div>
              <h3>2. Clients scannent</h3>
              <p>Vos clients scannent le QR code sur leur table pour accéder au menu instantanément.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <CreditCard size={48} className="feature-icon" />
              </div>
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
                  <div className="benefit-icon">
                    <Check size={20} />
                  </div>
                  <span>Réduction des coûts d'impression</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Check size={20} />
                  </div>
                  <span>Service plus rapide</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Check size={20} />
                  </div>
                  <span>Mise à jour instantanée des menus</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Check size={20} />
                  </div>
                  <span>Analyses détaillées des ventes</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Check size={20} />
                  </div>
                  <span>Expérience client moderne</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Check size={20} />
                  </div>
                  <span>Gestion des commandes en temps réel</span>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="chart-container">
                <BarChart3 size={200} className="chart-icon" />
              </div>
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
              <Link href="/auth/register">
                <button className="btn-outline">Commencer</button>
              </Link>
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
              <Link href="/auth/register">
                <button className="btn-primary">Commencer</button>
              </Link>
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
              <Link href="/auth/register">
                <button className="btn-outline">Nous contacter</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à moderniser votre restaurant ?</h2>
            <p>Rejoignez des centaines de restaurants qui ont déjà fait le choix de l'innovation.</p>
            <Link href="/auth/register">
              <button className="btn-primary-large">Démarrer gratuitement</button>
            </Link>
          </div>
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
