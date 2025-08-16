import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET - Récupérer une commande spécifique
export async function GET(request, { params }) {
  try {
    const { id } = params

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          special_instructions,
          menu_items (
            id,
            name,
            description,
            image_url
          )
        ),
        restaurants (
          id,
          name,
          phone,
          address
        )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Erreur API GET /orders/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour le statut d'une commande
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { 
      status,
      payment_status,
      estimated_ready_time,
      notes,
      preparation_time
    } = body

    // Validation du statut
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded']

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        { error: `Statut paiement invalide. Valeurs autorisées: ${validPaymentStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Récupérer la commande actuelle
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Préparer les données de mise à jour
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      
      // Logique automatique selon le statut
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString()
          if (!estimated_ready_time) {
            // Estimer 15-30 minutes selon complexité
            const estimatedMinutes = 20 // Logique plus complexe possible
            updateData.estimated_ready_time = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString()
          }
          break
        
        case 'preparing':
          updateData.preparation_started_at = new Date().toISOString()
          break
        
        case 'ready':
          updateData.ready_at = new Date().toISOString()
          break
        
        case 'completed':
          updateData.completed_at = new Date().toISOString()
          if (currentOrder.payment_status === 'pending') {
            updateData.payment_status = 'paid'
          }
          break
        
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString()
          updateData.payment_status = 'refunded'
          break
      }
    }

    if (payment_status) updateData.payment_status = payment_status
    if (estimated_ready_time) updateData.estimated_ready_time = estimated_ready_time
    if (notes !== undefined) updateData.notes = notes.trim()
    if (preparation_time) updateData.actual_preparation_time = preparation_time

    // Mettre à jour la commande
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
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
      .single()

    if (updateError) {
      console.error('Erreur mise à jour commande:', updateError)
      return NextResponse.json(
        { error: 'Erreur mise à jour de la commande' },
        { status: 500 }
      )
    }

    // TODO: Envoyer notification au client selon le nouveau statut
    // TODO: Webhook vers système de caisse si intégré
    // TODO: Analytics et tracking

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: getStatusMessage(status, currentOrder.status)
    })

  } catch (error) {
    console.error('Erreur API PUT /orders/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// DELETE - Annuler une commande
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Vérifier que la commande peut être annulée
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Ne pas permettre l'annulation si déjà préparée ou terminée
    if (['ready', 'completed'].includes(currentOrder.status)) {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une commande déjà prête ou terminée' },
        { status: 400 }
      )
    }

    // Marquer comme annulée au lieu de supprimer
    const { data: cancelledOrder, error: cancelError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        payment_status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (cancelError) {
      console.error('Erreur annulation commande:', cancelError)
      return NextResponse.json(
        { error: 'Erreur annulation de la commande' },
        { status: 500 }
      )
    }

    // TODO: Traiter le remboursement si paiement en ligne
    // TODO: Notifier le client de l'annulation

    return NextResponse.json({
      success: true,
      order: cancelledOrder,
      message: `Commande ${currentOrder.order_number} annulée avec succès`
    })

  } catch (error) {
    console.error('Erreur API DELETE /orders/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour les messages de statut
function getStatusMessage(newStatus, oldStatus) {
  const messages = {
    'confirmed': 'Commande confirmée par le restaurant',
    'preparing': 'Préparation en cours',
    'ready': 'Commande prête à être récupérée',
    'completed': 'Commande terminée',
    'cancelled': 'Commande annulée'
  }
  
  return messages[newStatus] || `Statut mis à jour: ${newStatus}`
}
