import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET - Récupérer toutes les catégories d'un restaurant
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')
    const includeItems = searchParams.get('include_items') === 'true'

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID requis' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('categories')
      .select(includeItems ? `
        *,
        menu_items (
          id,
          name,
          description,
          price,
          image_url,
          available,
          created_at
        )
      ` : '*')
      .eq('restaurant_id', restaurantId)
      .order('order_index')

    const { data: categories, error: categoriesError } = await query

    if (categoriesError) {
      console.error('Erreur récupération catégories:', categoriesError)
      return NextResponse.json(
        { error: 'Erreur récupération catégories' },
        { status: 500 }
      )
    }

    // Statistiques par catégorie si items inclus
    const stats = includeItems ? {
      totalCategories: categories.length,
      totalItems: categories.reduce((sum, cat) => sum + (cat.menu_items?.length || 0), 0),
      activeCategories: categories.filter(cat => cat.active).length
    } : null

    return NextResponse.json({
      success: true,
      categories: categories || [],
      stats
    })

  } catch (error) {
    console.error('Erreur API GET /categories:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      restaurant_id,
      name,
      description,
      color,
      icon,
      order_index
    } = body

    // Validation des données essentielles
    if (!restaurant_id || !name) {
      return NextResponse.json(
        { error: 'Restaurant ID et nom requis' },
        { status: 400 }
      )
    }

    // Vérifier que le restaurant existe
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      )
    }

    // Calculer l'ordre si non spécifié
    let finalOrderIndex = order_index
    if (finalOrderIndex === undefined) {
      const { data: lastCategory } = await supabase
        .from('categories')
        .select('order_index')
        .eq('restaurant_id', restaurant_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      finalOrderIndex = (lastCategory?.order_index || 0) + 1
    }

    // Créer la catégorie
    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert({
        restaurant_id,
        name: name.trim(),
        description: description?.trim() || '',
        color: color || '#6B7280',
        icon: icon || 'utensils',
        order_index: finalOrderIndex,
        active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création catégorie:', insertError)
      return NextResponse.json(
        { error: 'Erreur création de la catégorie' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: `Catégorie "${newCategory.name}" créée avec succès`
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur API POST /categories:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT - Réorganiser l'ordre des catégories
export async function PUT(request) {
  try {
    const body = await request.json()
    const { restaurant_id, categories_order } = body

    if (!restaurant_id || !Array.isArray(categories_order)) {
      return NextResponse.json(
        { error: 'Restaurant ID et ordre des catégories requis' },
        { status: 400 }
      )
    }

    // Mettre à jour l'ordre de chaque catégorie
    const updatePromises = categories_order.map((categoryId, index) =>
      supabase
        .from('categories')
        .update({ 
          order_index: index + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .eq('restaurant_id', restaurant_id)
    )

    const results = await Promise.all(updatePromises)
    
    // Vérifier s'il y a eu des erreurs
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Erreurs réorganisation:', errors)
      return NextResponse.json(
        { error: 'Erreur lors de la réorganisation' },
        { status: 500 }
      )
    }

    // Récupérer les catégories réorganisées
    const { data: updatedCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .order('order_index')

    if (fetchError) {
      console.error('Erreur récupération catégories réorganisées:', fetchError)
      return NextResponse.json(
        { error: 'Erreur récupération des catégories' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      categories: updatedCategories,
      message: 'Catégories réorganisées avec succès'
    })

  } catch (error) {
    console.error('Erreur API PUT /categories:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une catégorie (par query param)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')
    const restaurantId = searchParams.get('restaurant_id')

    if (!categoryId || !restaurantId) {
      return NextResponse.json(
        { error: 'Category ID et Restaurant ID requis' },
        { status: 400 }
      )
    }

    // Vérifier si la catégorie a des plats
    const { data: menuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', categoryId)

    if (itemsError) {
      console.error('Erreur vérification plats:', itemsError)
      return NextResponse.json(
        { error: 'Erreur vérification des plats' },
        { status: 500 }
      )
    }

    if (menuItems && menuItems.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une catégorie contenant des plats. Supprimez d\'abord les plats.' },
        { status: 400 }
      )
    }

    // Récupérer le nom avant suppression
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .eq('restaurant_id', restaurantId)
      .single()

    // Supprimer la catégorie
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('restaurant_id', restaurantId)

    if (deleteError) {
      console.error('Erreur suppression catégorie:', deleteError)
      return NextResponse.json(
        { error: 'Erreur suppression de la catégorie' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Catégorie "${category?.name || 'inconnue'}" supprimée avec succès`
    })

  } catch (error) {
    console.error('Erreur API DELETE /categories:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
