'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, CreditCard, Bell, Check, Menu, X, ArrowRight, Star, Users, Zap, Shield } from 'lucide-react';

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
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      color: '#1d2129',
      margin: 0,
      padding: 0
    }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: isScrolled ? 'rgba(248, 249, 250, 0.95)' : 'transparent',
        backdropFilter: 'blur(10px)',
        borderBottom: isScrolled ? '1px solid rgba(233, 236, 239, 0.3)' : 'none',
        transition: 'all 0.3s ease',
        padding: '1rem 0'
      }}>
        <nav style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1d2129'
          }}>
            <QrCode size={32} style={{ color: '#495057' }} />
            <span>Scan-eat</span>
          </div>
          
          {/* Desktop Navigation */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }} className="desktop-nav">
            <a href="/auth/login" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #495057',
              backgroundColor: 'transparent',
              color: '#495057',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              Se connecter
            </a>
            <a href="/auth/register" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              backgroundColor: '#1d2129',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              Essai gratuit
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#1d2129'
            }}
            className="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        paddingTop: '8rem',
        paddingBottom: '4rem',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #1d2129 0%, #495057 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Révolutionnez votre restaurant avec des menus QR intelligents
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#6c757d',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              De la simple consultation de menu au paiement complet, choisissez la solution qui correspond à vos besoins et boostez votre chiffre d'affaires.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <a href="/auth/register" style={{
                padding: '1rem 2rem',
                borderRadius: '12px',
                backgroundColor: '#1d2129',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(29, 33, 41, 0.3)'
              }}>
                Démarrer gratuitement <ArrowRight size={20} />
              </a>
              <button style={{
                padding: '1rem 2rem',
                borderRadius: '12px',
                border: '2px solid #495057',
                backgroundColor: 'transparent',
                color: '#495057',
                fontWeight: '600',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                Voir la démo
              </button>
            </div>
          </div>
          
          {/* Phone Mockup */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '300px',
              height: '600px',
              backgroundColor: '#1d2129',
              borderRadius: '40px',
              padding: '20px',
              boxShadow: '0 20px 60px rgba(29, 33, 41, 0.3)',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '30px',
                padding: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1d2129' }}>Restaurant Demo</h3>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Menu du jour</div>
                </div>
                
                {/* Menu Items */}
                {[
                  { name: 'Burger Gourmet', desc: 'Pain brioche, steak angus...', price: '15€' },
                  { name: 'Salade César', desc: 'Salade romaine, parmesan...', price: '12€' },
                  { name: 'Pizza Margherita', desc: 'Tomate, mozzarella, basilic', price: '14€' }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{item.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6c757d' }}>{item.desc}</p>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#1d2129' }}>{item.price}</span>
                  </div>
                ))}
                
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1d2129',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  marginTop: '1rem',
                  cursor: 'pointer'
                }}>
                  Commander maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '4rem 0',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            marginBottom: '3rem',
            color: '#1d2129'
          }}>
            Comment ça marche ?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: <QrCode size={48} />,
                title: '1. Créez votre menu',
                desc: 'Interface simple pour ajouter vos plats, photos et prix. QR code généré automatiquement.'
              },
              {
                icon: <Smartphone size={48} />,
                title: '2. Clients scannent',
                desc: 'Vos clients accèdent instantanément au menu depuis leur smartphone, sans app à télécharger.'
              },
              {
                icon: <CreditCard size={48} />,
                title: '3. Commande & paiement',
                desc: 'Selon votre forfait : consultation, commande avec notifications, ou paiement intégré.'
              }
            ].map((feature, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '2rem',
                borderRadius: '16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'inline-flex',
                  padding: '1rem',
                  backgroundColor: '#1d2129',
                  borderRadius: '50%',
                  color: 'white',
                  marginBottom: '1rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                  color: '#1d2129'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#6c757d',
                  lineHeight: 1.6
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{
        padding: '4rem 0',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '2.5rem',
              marginBottom: '2rem',
              color: '#1d2129'
            }}>
              Pourquoi choisir Scan-eat ?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                'Réduction des coûts d\'impression',
                'Service plus rapide et efficace',
                'Mise à jour instantanée des menus',
                'Analyses détaillées des ventes',
                'Expérience client moderne',
                'Gestion des commandes en temps réel'
              ].map((benefit, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#1d2129',
                    borderRadius: '50%',
                    color: 'white'
                  }}>
                    <Check size={16} />
                  </div>
                  <span style={{
                    fontSize: '1.1rem',
                    color: '#495057'
                  }}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              {[
                { icon: <Users size={32} />, label: 'Clients satisfaits' },
                { icon: <Zap size={32} />, label: 'Service rapide' },
                { icon: <Shield size={32} />, label: 'Sécurisé' },
                { icon: <Star size={32} />, label: 'Qualité premium' }
              ].map((item, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ color: '#495057', marginBottom: '0.5rem' }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '4rem 0',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: '#1d2129'
          }}>
            Tarifs simples et transparents
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '1.2rem',
            color: '#6c757d',
            marginBottom: '1rem'
          }}>
            Choisissez le forfait qui correspond à vos besoins et évoluez quand vous voulez
          </p>
          <div style={{
            textAlign: 'center',
            backgroundColor: '#e8f5e8',
            color: '#2d5016',
            padding: '1rem 2rem',
            borderRadius: '12px',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem auto',
            border: '1px solid #c3e6c3'
          }}>
            <strong>🎉 Offre de lancement : 1 mois d'essai gratuit sur tous les forfaits !</strong>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {[
              {
                name: 'Menu QR',
                price: '10',
                description: 'Parfait pour commencer',
                features: [
                  'Menu digital avec QR code',
                  'Consultation par les clients',
                  'Mise à jour en temps réel',
                  'Support par email',
                  'Interface responsive'
                ],
                icon: <QrCode size={32} />,
                popular: false
              },
              {
                name: 'Commandes',
                price: '30',
                description: 'Solution complète',
                features: [
                  'Tout du forfait Menu QR',
                  'Système de commandes',
                  'Notifications temps réel',
                  'Gestion du panier client',
                  'Tableau de bord avancé'
                ],
                icon: <Bell size={32} />,
                popular: true
              },
              {
                name: 'Paiements',
                price: '40',
                description: 'Expérience premium',
                features: [
                  'Tout du forfait Commandes',
                  'Paiement en ligne intégré',
                  'Stripe Connect sécurisé',
                  'Analytics avancées',
                  'Support prioritaire'
                ],
                icon: <CreditCard size={32} />,
                popular: false
              }
            ].map((plan, i) => (
              <div key={i} style={{
                position: 'relative',
                padding: '2rem',
                backgroundColor: plan.popular ? '#1d2129' : 'white',
                color: plan.popular ? 'white' : '#1d2129',
                borderRadius: '20px',
                border: plan.popular ? 'none' : '2px solid #e9ecef',
                boxShadow: plan.popular ? '0 20px 60px rgba(29, 33, 41, 0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                transform: plan.popular ? 'scale(1.05)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#495057',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Le plus populaire
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: plan.popular ? 'rgba(255,255,255,0.1)' : '#f8f9fa',
                    borderRadius: '8px',
                    color: plan.popular ? 'white' : '#495057'
                  }}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      margin: 0,
                      fontWeight: 'bold'
                    }}>
                      {plan.name}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      opacity: 0.8
                    }}>
                      {plan.description}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.25rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: 'bold'
                    }}>
                      {plan.price}€
                    </span>
                    <span style={{
                      fontSize: '1.1rem',
                      opacity: 0.8
                    }}>
                      /mois
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    fontStyle: 'italic'
                  }}>
                    Premier mois gratuit
                  </div>
                </div>
                
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.5rem 0'
                }}>
                  {plan.features.map((feature, j) => (
                    <li key={j} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        backgroundColor: plan.popular ? 'rgba(255,255,255,0.2)' : '#1d2129',
                        borderRadius: '50%',
                        color: plan.popular ? 'white' : 'white'
                      }}>
                        <Check size={12} />
                      </div>
                      <span style={{ fontSize: '0.95rem' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <a href="/auth/register" style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: plan.popular ? 'white' : '#1d2129',
                  color: plan.popular ? '#1d2129' : 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}>
                  Essayer gratuitement
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 0',
        background: 'linear-gradient(135deg, #1d2129 0%, #495057 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            marginBottom: '1rem'
          }}>
            Prêt à moderniser votre restaurant ?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            marginBottom: '2rem'
          }}>
            Rejoignez des centaines de restaurants qui ont déjà fait le choix de l'innovation. Commencez gratuitement dès aujourd'hui.
          </p>
          <a href="/auth/register" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1.2rem 2.5rem',
            backgroundColor: 'white',
            color: '#1d2129',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(255,255,255,0.3)'
          }}>
            Démarrer gratuitement <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#f8f9fa',
        padding: '3rem 0 1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1d2129'
            }}>
              <QrCode size={24} />
              <span>Scan-eat</span>
            </div>
            <div style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              <a href="#about" style={{ color: '#6c757d', textDecoration: 'none' }}>À propos</a>
              <a href="#contact" style={{ color: '#6c757d', textDecoration: 'none' }}>Contact</a>
              <a href="#terms" style={{ color: '#6c757d', textDecoration: 'none' }}>CGU</a>
              <a href="#privacy" style={{ color: '#6c757d', textDecoration: 'none' }}>Confidentialité</a>
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            paddingTop: '2rem',
            borderTop: '1px solid #e9ecef',
            color: '#6c757d'
          }}>
            <p>&copy; 2025 Scan-eat. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          h1 {
            font-size: 2.5rem !important;
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .benefits-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Homepage;