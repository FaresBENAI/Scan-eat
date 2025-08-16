import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET - Récupérer les informations d'un restaurant
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('id')
    const includeStats = searchParams.get('include_stats') === 'true'

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID requis' },
        { status: 400 }
      )
    }

    // Récupérer les infos du restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      )
    }

    let stats = null
    if (includeStats) {
      // Statistiques du restaurant
      const [categoriesResult, itemsResult, ordersResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('active', true),
        
        supabase
          .from('menu_items')
          .select('id, available')
          .eq('restaurant_id', restaurantId),
        
        supabase
          .from('orders')
          .select('id, status, total_amount, created_at')
          .eq('restaurant_id', restaurantId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 derniers jours
      ])

      const orders = ordersResult.data || []
      const completedOrders = orders.filter(o => o.status === 'completed')

      stats = {
        categories: {
          total: categoriesResult.data?.length || 0
        },
        menuItems: {
          total: itemsResult.data?.length || 0,
          available: itemsResult.data?.filter(item => item.available).length || 0,
          unavailable: itemsResult.data?.filter(item => !item.available).length || 0
        },
        orders: {
          total30Days: orders.length,
          completed30Days: completedOrders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          revenue30Days: completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        },
        performance: {
          averageOrderValue: completedOrders.length > 0 
            ? completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / completedOrders.length 
            : 0,
          ordersToday: orders.filter(o => 
            new Date(o.created_at).toDateString() === new Date().toDateString()
          ).length
        }
      }
    }

    return NextResponse.json({
      success: true,
      restaurant,
      stats
    })

  } catch (error) {
    console.error('Erreur API GET /restaurants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les informations du restaurant
export async function PUT(request) {
  try {
    const body = await request.json()
    const { 
      id,
      name,
      email,
      phone,
      address,
      description,
      cuisine_type,
      opening_hours,
      delivery_fee,
      minimum_order,
      payment_methods,
      special_instructions
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Restaurant ID requis' },
        { status: 400 }
      )
    }

    // Validation des données essentielles
    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      )
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    // Préparer les données de mise à jour
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim().toLowerCase()
    if (phone) updateData.phone = phone.trim()
    if (address) updateData.address = address.trim()
    if (description) updateData.description = description.trim()
    if (cuisine_type) updateData.cuisine_type = cuisine_type
    if (opening_hours) updateData.opening_hours = opening_hours
    if (delivery_fee !== undefined) updateData.delivery_fee = parseFloat(delivery_fee) || 0
    if (minimum_order !== undefined) updateData.minimum_order = parseFloat(minimum_order) || 0
    if (payment_methods) updateData.payment_methods = payment_methods
    if (special_instructions) updateData.special_instructions = special_instructions.trim()

    // Mettre à jour le restaurant
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur mise à jour restaurant:', updateError)
      return NextResponse.json(
        { error: 'Erreur mise à jour du restaurant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
      message: 'Informations restaurant mises à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API PUT /restaurants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau restaurant (inscription)
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      name,
      email,
      phone,
      address,
      owner_id // ID de l'utilisateur authentifié
    } = body

    // Validation des données essentielles
    if (!name || !email || !owner_id) {
      return NextResponse.json(
        { error: 'Nom, email et propriétaire requis' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    // Vérifier si l'email n'est pas déjà utilisé
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Un restaurant avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Générer QR code unique
    const qrCodeData = `${process.env.NEXT_PUBLIC_APP_URL}/menu/${owner_id}`
    
    // Créer le restaurant
    const { data: newRestaurant, error: insertError } = await supabase
      .from('restaurants')
      .insert({
        id: owner_id, // Lier à l'utilisateur
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        qr_code_url: qrCodeData,
        subscription_status: 'trial',
        subscription_plan: 'menu_qr',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 jours
        payment_methods: ['cash'],
        delivery_fee: 0,
        minimum_order: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création restaurant:', insertError)
      return NextResponse.json(
        { error: 'Erreur création du restaurant' },
        { status: 500 }
      )
    }

    // Créer des catégories par défaut
    const defaultCategories = [
      { name: 'Entrées', icon: 'chef-hat', color: '#10B981' },
      { name: 'Plats Principaux', icon: 'utensils', color: '#3B82F6' },
      { name: 'Desserts', icon: 'cake', color: '#F59E0B' },
      { name: 'Boissons', icon: 'coffee', color: '#6366F1' }
    ]

    const categoriesToInsert = defaultCategories.map((cat, index) => ({
      restaurant_id: newRestaurant.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      order_index: index + 1,
      active: true
    }))

    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)

    if (categoriesError) {
      console.error('Erreur création catégories par défaut:', categoriesError)
      // Ne pas faire échouer la création du restaurant
    }

    return NextResponse.json({
      success: true,
      restaurant: newRestaurant,
      message: `Restaurant "${newRestaurant.name}" créé avec succès`,
      qr_code_url: qrCodeData
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur API POST /restaurants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour valider l'email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
