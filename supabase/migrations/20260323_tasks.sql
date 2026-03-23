-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  status        TEXT        NOT NULL DEFAULT 'todo'   CHECK (status   IN ('todo','in_progress','done')),
  priority      TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  category      TEXT                                  CHECK (category IN ('placement','contact','inventory','billing','general')),
  linked_id     UUID,
  linked_label  TEXT,
  assigned_to   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-level security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can create tasks (created_by must be themselves)
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Assignee, creator, or admin/manager can update
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated USING (
    auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager')
    )
  );

-- Only admin/manager can delete
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager')
    )
  );
