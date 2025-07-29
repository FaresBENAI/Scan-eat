import MenuClient from './MenuClient';
import './menu.css';

// Fonction pour générer les paramètres statiques
export async function generateStaticParams() {
  // Pour l'export statique, on retourne un tableau vide
  return [];
}

export default function MenuPage({ params }) {
  const restaurantId = params['restaurant-id'];
  
  return <MenuClient restaurantId={restaurantId} />;
}
