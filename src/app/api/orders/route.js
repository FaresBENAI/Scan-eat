export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET - Récupérer les commandes d'un restaurant
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit')) || 50

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID requis' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          menu_items (
            id,
            name,
            description
          )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrer par statut si spécifié
    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError)
      return NextResponse.json(
        { error: 'Erreur récupération commandes', details: ordersError.message },
        { status: 500 }
      )
    }

    // Calculer les statistiques
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0)
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      stats
    })
  } catch (error) {
    console.error('Erreur API GET /orders:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle commande
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      restaurant_id,
      menu_id,
      customer_name,
      customer_phone,
      customer_email,
      table_number,
      items,
      total_amount,
      payment_method = 'cash'
    } = body

    // Validation des données requises
    if (!restaurant_id || !customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Données manquantes: restaurant_id, customer_name, customer_phone et items requis' },
        { status: 400 }
      )
    }

    // Générer un numéro de commande unique
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        menu_id,
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email,
        table_number,
        total_amount: total_amount || 0,
        payment_method,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Erreur création commande:', orderError)
      return NextResponse.json(
        { error: 'Erreur création commande', details: orderError.message },
        { status: 500 }
      )
    }

    // Créer les items de commande
    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      special_instructions: item.special_instructions || '',
      customizations: item.customizations || []
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.error('Erreur création items:', itemsError)
      // Supprimer la commande si les items échouent
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Erreur création items de commande', details: itemsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        order_items: createdItems
      }
    })

  } catch (error) {
    console.error('Erreur API POST /orders:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}