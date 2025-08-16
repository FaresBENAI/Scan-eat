import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET - Récupérer un plat spécifique
export async function GET(request, { params }) {
  try {
    const { id } = params

    const { data: item, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        categories (
          id,
          name,
          restaurant_id
        )
      `)
      .eq('id', id)
      .single()

    if (error || !item) {
      return NextResponse.json(
        { error: 'Plat non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item
    })

  } catch (error) {
    console.error('Erreur API GET /menus/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT - Modifier un plat
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { 
      name, 
      description, 
      price, 
      image_url, 
      available,
      category_id 
    } = body

    // Validation des données
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nom et prix requis' },
        { status: 400 }
      )
    }

    // Mise à jour du plat
    const { data: updatedItem, error: updateError } = await supabase
      .from('menu_items')
      .update({
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        image_url: image_url || null,
        available: available !== undefined ? available : true,
        category_id: category_id || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur modification plat:', updateError)
      return NextResponse.json(
        { error: 'Erreur modification du plat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item: updatedItem
    })

  } catch (error) {
    console.error('Erreur API PUT /menus/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un plat
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Vérifier si le plat existe d'abord
    const { data: existingItem, error: checkError } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existingItem) {
      return NextResponse.json(
        { error: 'Plat non trouvé' },
        { status: 404 }
      )
    }

    // Suppression du plat
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erreur suppression plat:', deleteError)
      return NextResponse.json(
        { error: 'Erreur suppression du plat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Plat "${existingItem.name}" supprimé avec succès`
    })

  } catch (error) {
    console.error('Erreur API DELETE /menus/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
