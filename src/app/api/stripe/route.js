import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Configuration Stripe (à ajouter dans .env.local)
// STRIPE_SECRET_KEY=sk_test_...
// STRIPE_WEBHOOK_SECRET=whsec_...
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

// POST - Créer une session de paiement Stripe
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      type, // 'subscription' ou 'order'
      restaurant_id,
      plan_id,
      order_id,
      return_url,
      cancel_url
    } = body

    if (!type || !restaurant_id) {
      return NextResponse.json(
        { error: 'Type et restaurant_id requis' },
        { status: 400 }
      )
    }

    // Vérifier que le restaurant existe
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      )
    }

    if (type === 'subscription') {
      return await handleSubscriptionPayment(restaurant, plan_id, return_url, cancel_url)
    } else if (type === 'order') {
      return await handleOrderPayment(restaurant_id, order_id, return_url, cancel_url)
    } else {
      return NextResponse.json(
        { error: 'Type de paiement invalide' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur API POST /stripe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// Gérer les paiements d'abonnement
async function handleSubscriptionPayment(restaurant, planId, returnUrl, cancelUrl) {
  // Plans disponibles
  const plans = {
    'menu_qr': {
      name: 'Menu QR',
      price: 1000, // 10€ en centimes
      description: 'Menu QR code simple',
      features: ['Menu QR illimité', 'Personnalisation basique']
    },
    'orders': {
      name: 'Commandes',
      price: 3000, // 30€ en centimes
      description: 'Menu + Système de commandes',
      features: ['Tout Menu QR', 'Commandes en ligne', 'Gestion temps réel']
    },
    'payments': {
      name: 'Paiements',
      price: 4000, // 40€ en centimes
      description: 'Solution complète avec paiements',
      features: ['Tout Commandes', 'Paiement en ligne', 'Analytics avancées', 'Intégrations caisses']
    }
  }

  const selectedPlan = plans[planId]
  if (!selectedPlan) {
    return NextResponse.json(
      { error: 'Plan invalide' },
      { status: 400 }
    )
  }

  // TODO: Intégrer vraie API Stripe ici
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  
  // Simulation de session Stripe pour le développement
  const mockSession = {
    id: `cs_test_${Date.now()}`,
    url: `https://checkout.stripe.com/pay/mock#${planId}`,
    customer_id: `cus_${restaurant.id}`,
    subscription_id: `sub_${Date.now()}`,
    payment_intent: `pi_${Date.now()}`
  }

  // Enregistrer la tentative de paiement
  const { error: logError } = await supabase
    .from('payment_attempts')
    .insert({
      restaurant_id: restaurant.id,
      type: 'subscription',
      plan_id: planId,
      amount: selectedPlan.price,
      stripe_session_id: mockSession.id,
      status: 'pending',
      metadata: {
        plan_name: selectedPlan.name,
        features: selectedPlan.features
      }
    })

  if (logError) {
    console.error('Erreur log paiement:', logError)
  }

  return NextResponse.json({
    success: true,
    session_id: mockSession.id,
    checkout_url: mockSession.url,
    plan: selectedPlan,
    message: 'Session de paiement créée'
  })
}

// Gérer les paiements de commandes
async function handleOrderPayment(restaurantId, orderId, returnUrl, cancelUrl) {
  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID requis pour le paiement de commande' },
      { status: 400 }
    )
  }

  // Récupérer la commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        total_price,
        menu_items (name)
      )
    `)
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId)
    .single()

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Commande non trouvée' },
      { status: 404 }
    )
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json(
      { error: 'Commande déjà payée' },
      { status: 400 }
    )
  }

  // TODO: Créer vraie session Stripe pour commande
  const mockSession = {
    id: `cs_order_${Date.now()}`,
    url: `https://checkout.stripe.com/pay/order#${orderId}`,
    payment_intent: `pi_order_${Date.now()}`
  }

  // Enregistrer la tentative de paiement
  const { error: logError } = await supabase
    .from('payment_attempts')
    .insert({
      restaurant_id: restaurantId,
      order_id: orderId,
      type: 'order',
      amount: Math.round(order.total_amount * 100), // Convertir en centimes
      stripe_session_id: mockSession.id,
      status: 'pending',
      metadata: {
        order_number: order.order_number,
        customer_name: order.customer_name,
        items_count: order.order_items?.length || 0
      }
    })

  if (logError) {
    console.error('Erreur log paiement commande:', logError)
  }

  return NextResponse.json({
    success: true,
    session_id: mockSession.id,
    checkout_url: mockSession.url,
    order: {
      id: order.id,
      number: order.order_number,
      total: order.total_amount,
      customer: order.customer_name
    },
    message: 'Session de paiement commande créée'
  })
}

// GET - Vérifier le statut d'un paiement
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const restaurantId = searchParams.get('restaurant_id')

    if (!sessionId || !restaurantId) {
      return NextResponse.json(
        { error: 'Session ID et Restaurant ID requis' },
        { status: 400 }
      )
    }

    // Récupérer les détails du paiement
    const { data: paymentAttempt, error: paymentError } = await supabase
      .from('payment_attempts')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (paymentError || !paymentAttempt) {
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    // TODO: Vérifier le statut réel avec Stripe API
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Pour le développement, simuler un succès après 30 secondes
    const isSimulatedSuccess = Date.now() - new Date(paymentAttempt.created_at).getTime() > 30000

    if (isSimulatedSuccess && paymentAttempt.status === 'pending') {
      // Marquer comme payé
      await supabase
        .from('payment_attempts')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentAttempt.id)

      // Si c'est un abonnement, mettre à jour le restaurant
      if (paymentAttempt.type === 'subscription') {
        await supabase
          .from('restaurants')
          .update({
            subscription_status: 'active',
            subscription_plan: paymentAttempt.plan_id,
            subscription_started_at: new Date().toISOString(),
            subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
          })
          .eq('id', restaurantId)
      }

      // Si c'est une commande, mettre à jour le statut
      if (paymentAttempt.type === 'order' && paymentAttempt.order_id) {
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', paymentAttempt.order_id)
      }

      paymentAttempt.status = 'completed'
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentAttempt.id,
        status: paymentAttempt.status,
        type: paymentAttempt.type,
        amount: paymentAttempt.amount,
        created_at: paymentAttempt.created_at,
        metadata: paymentAttempt.metadata
      }
    })

  } catch (error) {
    console.error('Erreur API GET /stripe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
