export interface Perk {
  id: string
  name: string
  description: string
}

export const PERKS: Perk[] = [
  {
    id: 'swap_characteristics',
    name: 'Zamiana cech',
    description: 'Po wylosowaniu cech możesz zamienić jedną parę cech miejscami (przed modyfikatorami wiekowymi).',
  },
  {
    id: 'drive_pillars',
    name: 'Motywacja i Filary',
    description: 'Zastępuje tradycyjną historię postaci systemem Motywacji, Filarów Poczytalności i Źródeł Stabilności.',
  },
]

export function getPerkById(id: string): Perk | undefined {
  return PERKS.find((p) => p.id === id)
}
