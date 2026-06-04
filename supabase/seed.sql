-- =============================================================
-- Seed data — run after schema.sql
-- =============================================================

-- Sample upcoming event
insert into public.events (
  title, title_pt,
  description, description_pt,
  date,
  location, location_pt,
  google_maps_url,
  is_active
) values (
  'Saturday Morning Run — Myrtle Beach Boardwalk',
  'Corrida de Sábado — Calçadão de Myrtle Beach',
  'Join us for our weekly Saturday run along the beautiful Myrtle Beach Boardwalk! All paces welcome. We''ll meet at the main pavilion, run 3–5 miles together, then grab coffee nearby.',
  'Venha correr conosco no nosso sábado semanal pelo lindo calçadão de Myrtle Beach! Todos os ritmos são bem-vindos. Nos encontramos no pavilhão principal, corremos 5–8 km juntos e depois tomamos um café.',
  (now() + interval '7 days')::date || 'T07:30:00-04:00',
  '1200 N Ocean Blvd, Myrtle Beach, SC 29577',
  '1200 N Ocean Blvd, Myrtle Beach, SC 29577',
  'https://maps.google.com/?q=Myrtle+Beach+Boardwalk+SC',
  true
);

-- Sample past event (for history/gallery context)
insert into public.events (
  title, title_pt,
  date, location, location_pt,
  is_active
) values (
  'Spring 5K Fun Run',
  'Corrida de Primavera 5K',
  (now() - interval '14 days')::date || 'T08:00:00-04:00',
  'Myrtle Beach State Park, 4401 S Kings Hwy',
  'Parque Estadual de Myrtle Beach, 4401 S Kings Hwy',
  false
);
