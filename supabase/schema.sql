-- ============================================================
-- Villa Concierge Co — Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CONTACTS
-- type: 'adjuster' | 'tpa' | 'vendor' | 'policyholder'
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('adjuster', 'tpa', 'vendor', 'policyholder')),

  -- Shared fields
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  last_contact_date DATE,

  -- Adjuster-specific
  carrier TEXT,
  tpa_id UUID REFERENCES contacts(id),

  -- TPA-specific
  company_name TEXT,
  billing_contact TEXT,

  -- Vendor-specific
  coi_expiration DATE,
  performance_notes TEXT,

  -- Policyholder-specific
  household_size INTEGER,
  pets BOOLEAN DEFAULT FALSE,
  pet_details TEXT,
  accessibility_needs TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UNITS (Housing Inventory)
-- ============================================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id TEXT UNIQUE NOT NULL,           -- Human-readable ID e.g. "VCC-001"
  property_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC(3,1) NOT NULL,
  max_occupants INTEGER,
  sq_ft INTEGER,
  monthly_rate NUMERIC(10,2),
  daily_rate NUMERIC(10,2),
  ale_eligible BOOLEAN DEFAULT TRUE,
  pet_friendly BOOLEAN DEFAULT FALSE,
  accessibility BOOLEAN DEFAULT FALSE,
  tier INTEGER CHECK (tier IN (1, 2, 3)),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'reserved', 'inactive')),

  -- Vendor/owner
  vendor_id UUID REFERENCES contacts(id),
  vendor_name TEXT,
  vendor_phone TEXT,
  vendor_email TEXT,

  -- Links
  property_link TEXT,
  dropbox_link TEXT,
  amenities TEXT[],

  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLACEMENTS
-- ============================================================
CREATE TABLE placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number TEXT NOT NULL,
  carrier_name TEXT NOT NULL,

  -- Links
  policyholder_id UUID NOT NULL REFERENCES contacts(id),
  adjuster_id UUID REFERENCES contacts(id),
  unit_id UUID REFERENCES units(id),

  -- ALE financials
  ale_daily_limit NUMERIC(10,2),
  ale_total_cap NUMERIC(10,2),
  ale_running_total NUMERIC(10,2) DEFAULT 0,
  -- ale_remaining is computed: ale_total_cap - ale_running_total

  -- Dates
  move_in_date DATE,
  move_out_date DATE,
  ale_expiry_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('active', 'pending', 'discharged', 'cancelled')),

  -- Docs
  dropbox_link TEXT,
  signed_lease_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id UUID NOT NULL REFERENCES placements(id),
  invoice_number TEXT UNIQUE,
  carrier_tpa_name TEXT,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),

  total NUMERIC(10,2) DEFAULT 0,
  date_sent DATE,
  due_date DATE,
  date_paid DATE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICE LINE ITEMS
-- ============================================================
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('housing_per_diem', 'utilities', 'management_fee', 'other')),
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES (polymorphic — links to placement OR unit)
-- ============================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id UUID REFERENCES placements(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author TEXT DEFAULT 'Staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT notes_must_have_parent CHECK (
    (placement_id IS NOT NULL)::INTEGER + (unit_id IS NOT NULL)::INTEGER = 1
  )
);

-- ============================================================
-- CHECKLISTS (move-in / move-out)
-- ============================================================
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('move_in', 'move_out')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOG (append-only)
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('placement', 'unit', 'invoice', 'contact')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,        -- e.g. "status_changed", "note_added", "invoice_sent"
  description TEXT NOT NULL,   -- Human-readable e.g. "Status changed from Pending to Active"
  old_value TEXT,
  new_value TEXT,
  actor TEXT DEFAULT 'Staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UNIT PHOTOS
-- ============================================================
CREATE TABLE unit_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_placements_status ON placements(status);
CREATE INDEX idx_placements_ale_expiry ON placements(ale_expiry_date);
CREATE INDEX idx_placements_unit ON placements(unit_id);
CREATE INDEX idx_placements_policyholder ON placements(policyholder_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_city ON units(city);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_placement ON invoices(placement_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_notes_placement ON notes(placement_id);
CREATE INDEX idx_notes_unit ON notes(unit_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_placements
  BEFORE UPDATE ON placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_contacts
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-LOG status changes on placements
-- ============================================================
CREATE OR REPLACE FUNCTION log_placement_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_log (entity_type, entity_id, action, description, old_value, new_value)
    VALUES ('placement', NEW.id, 'status_changed',
      'Placement status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_placement_status
  AFTER UPDATE ON placements
  FOR EACH ROW EXECUTE FUNCTION log_placement_status_change();

-- ============================================================
-- AUTO-LOG status changes on units
-- ============================================================
CREATE OR REPLACE FUNCTION log_unit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_log (entity_type, entity_id, action, description, old_value, new_value)
    VALUES ('unit', NEW.id, 'status_changed',
      'Unit ' || NEW.unit_id || ' status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_unit_status
  AFTER UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION log_unit_status_change();
