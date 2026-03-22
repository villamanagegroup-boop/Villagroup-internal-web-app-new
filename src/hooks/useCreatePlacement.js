import { supabase } from '../lib/supabase'

const DEFAULT_MOVE_IN_ITEMS = [
  'Keys received by policyholder',
  'Walk-through completed',
  'Utilities confirmed on',
  'Lease signed and uploaded',
  'Photo documentation completed',
  'Emergency contacts collected',
  'Household inventory noted',
  'Pet deposit collected (if applicable)',
  'Accessibility needs confirmed',
  'Move-in date confirmed with adjuster',
]

export async function createPlacement(formData) {
  // 1. Create policyholder contact
  const { data: policyholder, error: phErr } = await supabase
    .from('contacts')
    .insert({
      type: 'policyholder',
      name: formData.policyholder_name,
      phone: formData.policyholder_phone,
      email: formData.policyholder_email,
      household_size: formData.household_size ? Number(formData.household_size) : null,
      pets: formData.pets || false,
      pet_details: formData.pet_details,
      accessibility_needs: formData.accessibility_needs,
    })
    .select()
    .single()

  if (phErr) return { error: phErr }

  // 2. Create placement
  const { data: placement, error: plErr } = await supabase
    .from('placements')
    .insert({
      claim_number: formData.claim_number,
      carrier_name: formData.carrier_name,
      policyholder_id: policyholder.id,
      adjuster_id: formData.adjuster_id || null,
      unit_id: formData.unit_id || null,
      ale_daily_limit: formData.ale_daily_limit ? Number(formData.ale_daily_limit) : null,
      ale_total_cap: formData.ale_total_cap ? Number(formData.ale_total_cap) : null,
      ale_expiry_date: formData.ale_expiry_date || null,
      move_in_date: formData.move_in_date || null,
      move_out_date: formData.move_out_date || null,
      status: 'pending',
    })
    .select()
    .single()

  if (plErr) return { error: plErr }

  // 3. Create move-in checklist with default items
  const { data: checklist, error: clErr } = await supabase
    .from('checklists')
    .insert({ placement_id: placement.id, type: 'move_in' })
    .select()
    .single()

  if (!clErr && checklist) {
    await supabase.from('checklist_items').insert(
      DEFAULT_MOVE_IN_ITEMS.map((label, i) => ({
        checklist_id: checklist.id,
        label,
        sort_order: i,
      }))
    )
  }

  // 4. Log creation
  await supabase.from('activity_log').insert({
    entity_type: 'placement',
    entity_id: placement.id,
    action: 'created',
    description: `Placement created for ${formData.policyholder_name} — Claim #${formData.claim_number}`,
  })

  return { data: placement, error: null }
}
