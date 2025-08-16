# 🍽️ STRUCTURE DU PROJET SAAS RESTAURANT
**Généré le:** Sat Aug 16 21:40:54 UTC 2025
**Environnement:** GitHub Codespaces

## 📋 INFORMATIONS GÉNÉRALES
- **Nom du repository:** Scan-eat
- **Branche actuelle:** main
- **Dernier commit:** 956697d - ✨ Add multiple menus system with client selection and dashboard management (FaresBENAI)

## 📁 ARBORESCENCE DU PROJET
```
.
├── .env.local
├── .gitignore
├── LICENSE
├── README.md
├── middleware.js
├── netlify.toml
├── next.config.js
├── out
│   ├── 404
│   │   └── index.html
│   ├── 404.html
│   ├── _next
│   │   ├── Ix6wITCeryIychjHP2_Yv
│   │   └── static
│   │       ├── Ix6wITCeryIychjHP2_Yv
│   │       ├── chunks
│   │       └── css
│   ├── _redirects
│   ├── index.html
│   └── index.txt
├── package-lock.json
├── package.json
├── public
│   └── _redirects
├── restaurant_saas_structure.md
└── src
    ├── app
    │   ├── api
    │   │   ├── categories
    │   │   ├── menus
    │   │   ├── orders
    │   │   ├── restaurants
    │   │   └── stripe
    │   ├── auth
    │   │   ├── callback
    │   │   ├── confirmation
    │   │   ├── login
    │   │   └── register
    │   ├── dashboard
    │   │   ├── dashboard.css
    │   │   ├── menu
    │   │   ├── menus
    │   │   ├── orders
    │   │   └── page.js
    │   ├── globals.css
    │   ├── layout.js
    │   ├── menu
    │   │   ├── [id]
    │   │   └── [restaurantId]
    │   └── page.js
    ├── components
    │   ├── Homepage.css
    │   └── Homepage.js
    └── lib
        └── supabase.js

32 directories, 24 files
```

## 📦 CONFIGURATION NODE.JS
### package.json
```json
{
  "name": "scan-eat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@netlify/plugin-nextjs": "^5.11.6",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.53.0",
    "lucide-react": "^0.263.1",
    "next": "14.1.0",
    "qrcode": "^1.5.4",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "eslint": "^8",
    "eslint-config-next": "14.1.0"
  }
}
```

### 🔍 Analyse des dépendances clés
**Frontend Framework:**
-     "dev": "next dev",
-     "build": "next build",
-     "start": "next start",
-     "lint": "next lint"
-     "@netlify/plugin-nextjs": "^5.11.6",
-     "@supabase/auth-helpers-nextjs": "^0.10.0",
-     "lucide-react": "^0.263.1",
-     "next": "14.1.0",
-     "react": "^18",
-     "react-dom": "^18"
-     "eslint-config-next": "14.1.0"

**UI/Styling:**

**Base de données:**
-     "@supabase/auth-helpers-nextjs": "^0.10.0",
-     "@supabase/supabase-js": "^2.53.0",

## ⚙️ FICHIERS DE CONFIGURATION
### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Retirer output: 'export' pour permettre les routes dynamiques
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### netlify.toml
```javascript
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🛣️ STRUCTURE DES ROUTES

## 🧩 COMPOSANTS PRINCIPAUX
### Composants dans src/components/
#### src/components/Homepage.js
```javascript
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
```

## 🗄️ CONFIGURATION SUPABASE
## 🚀 CONFIGURATION NETLIFY
### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔧 SCRIPTS ET HOOKS
### Scripts npm disponibles
```json
```

## 🔐 VARIABLES D'ENVIRONNEMENT

## 🎨 STYLES ET ASSETS
### Fichiers de style trouvés:
./src/components/Homepage.css
./src/app/globals.css
./src/app/auth/callback/callback.css
./src/app/auth/register/register.css
./src/app/auth/confirmation/confirmation.css
./src/app/auth/login/login.css
./src/app/dashboard/orders/orders.css
./src/app/dashboard/menus/menus.css
./src/app/dashboard/dashboard.css
./src/app/dashboard/menu/menu-management.css

