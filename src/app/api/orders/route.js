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
