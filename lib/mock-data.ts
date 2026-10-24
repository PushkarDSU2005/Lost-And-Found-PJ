/**
 * Mock item data for the Home page skeleton and unit tests.
 * Mirrors the shape of the real Item type from lib/types.ts.
 */
import type { Item } from '@/lib/types'

const now = new Date()
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

const LOC_LIBRARY = { id: 'loc-1', name: 'Main Library', building: 'Library Building', floor: 'Ground Floor', description: null, drop_point: false, hours: null, geom: null, created_at: daysAgo(30), updated_at: daysAgo(30) }
const LOC_LIB_DESK = { id: 'loc-2', name: 'Library Information Desk', building: 'Library Building', floor: 'Ground Floor', description: null, drop_point: true, hours: 'Mon–Fri 08:00–20:00', geom: null, created_at: daysAgo(30), updated_at: daysAgo(30) }

// Shared defaults to reduce repetition
const defaults = { contact_override: null, expires_at: null, resolved_at: null, is_sensitive: false, held_at: null, verification_question: null }

export const MOCK_ITEMS: Item[] = [
  {
    ...defaults,
    id: 'mock-1', reporter_id: 'user-1', report_type: 'lost', status: 'open', category: 'electronics',
    title: 'iPhone 14 Pro — Space Black',
    description: 'Black iPhone 14 Pro with a cracked bottom-right corner and a green glow-in-the-dark case.',
    location_id: 'loc-1', location_text: 'Main Library',
    date_occurred: daysAgo(2), created_at: daysAgo(2), updated_at: daysAgo(2),
    location: LOC_LIBRARY,
  },
  {
    ...defaults,
    id: 'mock-2', reporter_id: 'user-2', report_type: 'found', status: 'open', category: 'accessories',
    title: 'Brown leather bifold wallet',
    description: 'Contains several bank cards and a student railcard but no cash. Handed in to the Library desk.',
    location_id: 'loc-2', location_text: 'Library Information Desk',
    date_occurred: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(1),
    location: LOC_LIB_DESK,
  },
  {
    ...defaults,
    id: 'mock-3', reporter_id: 'user-1', report_type: 'lost', status: 'open', category: 'clothing',
    title: 'Navy blue puffer jacket — size M',
    description: 'North Face style navy puffer, size M. Has a small yellow badge on the left sleeve.',
    location_id: null, location_text: 'Student Cafeteria',
    date_occurred: daysAgo(3), created_at: daysAgo(3), updated_at: daysAgo(3),
  },
  {
    ...defaults,
    id: 'mock-4', reporter_id: 'user-3', report_type: 'found', status: 'open', category: 'keys',
    title: 'Set of 3 keys on a red carabiner',
    description: 'Three keys on a bright red carabiner clip with a small Eiffel Tower keyring.',
    location_id: null, location_text: 'Lecture Theatre LT1',
    date_occurred: daysAgo(4), created_at: daysAgo(4), updated_at: daysAgo(4),
  },
  {
    ...defaults,
    id: 'mock-5', reporter_id: 'user-2', report_type: 'lost', status: 'open', category: 'books_stationery',
    title: 'Organic Chemistry textbook (Clayden, 2nd ed)',
    description: 'Clayden Organic Chemistry 2nd edition. Name "Alice N" on first page.',
    location_id: null, location_text: 'Science Block',
    date_occurred: daysAgo(5), created_at: daysAgo(5), updated_at: daysAgo(5),
  },
  {
    ...defaults,
    id: 'mock-6', reporter_id: 'user-3', report_type: 'found', status: 'claimed', category: 'sports_fitness',
    title: 'Black Hydro Flask 32oz water bottle',
    description: 'Black Hydro Flask with University sticker and the name "Josh" in marker.',
    location_id: null, location_text: 'Sports Hall',
    date_occurred: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(0),
  },
  {
    ...defaults,
    id: 'mock-7', reporter_id: 'user-1', report_type: 'found', status: 'open', category: 'electronics',
    title: 'White wireless earbuds in charging case',
    description: 'White AirPods-style earbuds; case has a small dent on the lid.',
    location_id: null, location_text: 'Main Library',
    date_occurred: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    ...defaults,
    is_sensitive: true,
    id: 'mock-8', reporter_id: 'user-2', report_type: 'lost', status: 'open', category: 'id_documents',
    title: 'International passport — found near security gate',
    description: 'A passport was found near the main gate. Visit the Security Desk with proof of identity.',
    location_id: null, location_text: 'Security Desk',
    date_occurred: daysAgo(0), created_at: daysAgo(0), updated_at: daysAgo(0),
  },
]
