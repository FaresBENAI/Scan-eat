import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// POST - Webhook Stripe pour les événements de paiement
export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    // TODO: Vérifier la signature Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    // Simulation d'événement pour le développement
    const event = JSON.parse(body)

    console.log('Webhook Stripe reçu:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object)
        break
      
      default:
        console.log(`Événement non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Erreur webhook Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 400 }
    )
  }
}

// Gérer la fin du checkout
async function handleCheckoutCompleted(session) {
  try {
    // Récupérer l'attempt de paiement
    const { data: paymentAttempt, error } = await supabase
      .from('payment_attempts')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single()

    if (error || !paymentAttempt) {
      console.error('Payment attempt non trouvé:', session.id)
      return
    }

    // Marquer comme complété
    await supabase
      .from('payment_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_payment_intent: session.payment_intent
      })
      .eq('id', paymentAttempt.id)

    if (paymentAttempt.type === 'subscription') {
      // Activer l'abonnement
      await supabase
        .from('restaurants')
        .update({
          subscription_status: 'active',
          subscription_plan: paymentAttempt.plan_id,
          stripe_customer_id: session.customer,
          subscription_started_at: new Date().toISOString()
        })
        .eq('id', paymentAttempt.restaurant_id)
    } else if (paymentAttempt.type === 'order') {
      // Marquer la commande comme payée
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent: session.payment_intent
        })
        .eq('id', paymentAttempt.order_id)
    }

    console.log('Paiement traité avec succès:', session.id)

  } catch (error) {
    console.error('Erreur traitement checkout:', error)
  }
}

// Gérer les paiements d'abonnement récurrents
async function handleSubscriptionPayment(invoice) {
  try {
    // Prolonger l'abonnement
    const nextPeriodEnd = new Date(invoice.current_period_end * 1000)
    
    await supabase
      .from('restaurants')
      .update({
        subscription_current_period_end: nextPeriodEnd.toISOString(),
        subscription_status: 'active'
      })
      .eq('stripe_customer_id', invoice.customer)

    console.log('Abonnement renouvelé:', invoice.customer)

  } catch (error) {
    console.error('Erreur renouvellement abonnement:', error)
  }
}

// Gérer les échecs de paiement
async function handlePaymentFailed(invoice) {
  try {
    await supabase
      .from('restaurants')
      .update({
        subscription_status: 'past_due'
      })
      .eq('stripe_customer_id', invoice.customer)

    // TODO: Envoyer notification d'échec de paiement

    console.log('Paiement échoué:', invoice.customer)

  } catch (error) {
    console.error('Erreur traitement échec paiement:', error)
  }
}

// Gérer l'annulation d'abonnement
async function handleSubscriptionCancelled(subscription) {
  try {
    await supabase
      .from('restaurants')
      .update({
        subscription_status: 'cancelled',
        subscription_cancelled_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', subscription.customer)

    console.log('Abonnement annulé:', subscription.customer)

  } catch (error) {
    console.error('Erreur annulation abonnement:', error)
  }
}
