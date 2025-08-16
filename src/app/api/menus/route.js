import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET - Récupérer tous les menus d'un restaurant
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')
    const menuId = searchParams.get('menu_id') // Optionnel pour un menu spécifique
    const includeItems = searchParams.get('include_items') === 'true'

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID requis' },
        { status: 400 }
      )
    }

    // Si menu_id spécifique demandé
    if (menuId) {
      const { data: menu, error: menuError } = await supabase
        .from('menus')
        .select(`
          *,
          categories (
            *,
            ${includeItems ? 'menu_items (*)' : ''}
          )
        `)
        .eq('id', menuId)
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .single()

      if (menuError || !menu) {
        return NextResponse.json(
          { error: 'Menu non trouvé' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        menu,
        categories: menu.categories || []
      })
    }

    // Sinon, récupérer tous les menus du restaurant
    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select(`
        *,
        categories (
          *,
          ${includeItems ? 'menu_items (*)' : ''}
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('active', true)
      .order('order_index')

    if (menusError) {
      console.error('Erreur récupération menus:', menusError)
      return NextResponse.json(
        { error: 'Erreur récupération menus', details: menusError.message },
        { status: 500 }
      )
    }

    // Statistiques
    const stats = {
      totalMenus: menus.length,
      totalCategories: menus.reduce((sum, menu) => sum + (menu.categories?.length || 0), 0),
      totalItems: includeItems ? menus.reduce((sum, menu) => 
        sum + menu.categories.reduce((catSum, cat) => catSum + (cat.menu_items?.length || 0), 0), 0
      ) : null
    }

    return NextResponse.json({
      success: true,
      menus: menus || [],
      stats
    })

  } catch (error) {
    console.error('Erreur API GET /menus:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau menu
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      restaurant_id,
      name,
      description,
      availability_hours,
      availability_days
    } = body

    if (!restaurant_id || !name) {
      return NextResponse.json(
        { error: 'Restaurant ID et nom requis' },
        { status: 400 }
      )
    }

    // Calculer l'ordre
    const { data: lastMenu } = await supabase
      .from('menus')
      .select('order_index')
      .eq('restaurant_id', restaurant_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (lastMenu?.order_index || 0) + 1

    // Créer le menu
    const { data: newMenu, error: insertError } = await supabase
      .from('menus')
      .insert({
        restaurant_id,
        name: name.trim(),
        description: description?.trim() || '',
        availability_hours: availability_hours || null,
        availability_days: availability_days || null,
        order_index: orderIndex,
        active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création menu:', insertError)
      return NextResponse.json(
        { error: 'Erreur création du menu' },
        { status: 500 }
      )
    }

    // Créer des catégories par défaut pour le nouveau menu
    const defaultCategories = [
      { name: 'Entrées', order_index: 1 },
      { name: 'Plats Principaux', order_index: 2 },
      { name: 'Desserts', order_index: 3 },
      { name: 'Boissons', order_index: 4 }
    ]

    const categoriesToInsert = defaultCategories.map(cat => ({
      restaurant_id,
      menu_id: newMenu.id,
      name: cat.name,
      order_index: cat.order_index,
      active: true
    }))

    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)

    if (categoriesError) {
      console.error('Erreur création catégories par défaut:', categoriesError)
      // Ne pas faire échouer la création du menu
    }

    return NextResponse.json({
      success: true,
      menu: newMenu,
      message: `Menu "${newMenu.name}" créé avec succès`
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur API POST /menus:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un menu
export async function PUT(request) {
  try {
    const body = await request.json()
    const { 
      id,
      restaurant_id,
      name,
      description,
      availability_hours,
      availability_days,
      active
    } = body

    if (!id || !restaurant_id) {
      return NextResponse.json(
        { error: 'Menu ID et Restaurant ID requis' },
        { status: 400 }
      )
    }

    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (availability_hours) updateData.availability_hours = availability_hours
    if (availability_days) updateData.availability_days = availability_days
    if (active !== undefined) updateData.active = active

    const { data: updatedMenu, error: updateError } = await supabase
      .from('menus')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', restaurant_id)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur mise à jour menu:', updateError)
      return NextResponse.json(
        { error: 'Erreur mise à jour du menu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      menu: updatedMenu,
      message: 'Menu mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API PUT /menus:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
