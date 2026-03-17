/**
 * Military Gear Catalog — Equipment available to military personnel
 * Era: Klasyczna (lata 20. XX wieku)
 */

export interface MilitaryItem {
  id: string
  name: string
  price: number
  description: string
  tag: string
  fromService?: boolean
}

export const MILITARY_CATALOG: MilitaryItem[] = [
  {
    id: 'bagnet',
    name: 'Bagnet',
    price: 5,
    description: 'Bagnet do karabinu. Obrażenia: 1K6+PO w walce wręcz.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'manierka_wojskowa',
    name: 'Manierka wojskowa',
    price: 1,
    description: 'Standardowa manierka aluminiowa, pojemność ok. 1 litra.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'kompas_wojskowy',
    name: 'Kompas wojskowy',
    price: 5,
    description: 'Kompas pryzmatyczny z pokrywą, standard wojskowy.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'ladownice',
    name: 'Ładownice',
    price: 3,
    description: 'Ładownice na amunicję (pas z kieszeniami). Mieszczą 60–90 nabojów.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'lornetka_wojskowa',
    name: 'Lornetka wojskowa',
    price: 15,
    description: 'Lornetka polowa 6×30, standard wojskowy z etui.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'apteczka_wojskowa',
    name: 'Apteczka polowa (wojskowa)',
    price: 5,
    description: 'Indywidualny pakiet opatrunkowy: bandaż, jodyna, opatrunek.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'helm_stalowy',
    name: 'Hełm stalowy',
    price: 8,
    description: 'Hełm stalowy (Brodie, Stahlhelm lub Adrian). Pancerz: 2 pkt. na głowę.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'maska_gazowa',
    name: 'Maska przeciwgazowa',
    price: 10,
    description: 'Maska z filtrem chroniącym przed gazami bojowymi.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'mundur',
    name: 'Mundur wojskowy',
    price: 15,
    description: 'Pełny mundur wojskowy z butami i pasem.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'plecak_wojskowy',
    name: 'Plecak wojskowy',
    price: 5,
    description: 'Plecak piechoty z szelkami, pojemność ok. 30 litrów.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'saperka',
    name: 'Saperka',
    price: 2,
    description: 'Składana łopatka saperska. Może służyć jako broń improwizowana (1K6+PO).',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'bergmann_mp18',
    name: 'Bergmann MP18',
    price: 100,
    description: 'Pistolet maszynowy Bergmann MP18, 9mm. Obrażenia: 1K10, szybkostrzelny. Naboje: 32.',
    tag: '[Wojsko]',
  },
  {
    id: 'karabin_maszynowy_lekki',
    name: 'Karabin maszynowy lekki (Lewis / BAR)',
    price: 300,
    description: 'Lekki karabin maszynowy. Obrażenia: 2K6+4, ciągły ogień. Wymaga obsługi.',
    tag: '[Wojsko]',
  },
  {
    id: 'karabin_maszynowy_ciezki',
    name: 'Karabin maszynowy ciężki (Maxim / Vickers)',
    price: 750,
    description: 'Ciężki karabin maszynowy na trójnogu. Obrażenia: 2K6+4, ciągły ogień. Wymaga załogi 2–3 osób.',
    tag: '[Wojsko]',
  },
  {
    id: 'granat_wojskowy',
    name: 'Granat (wojskowy)',
    price: 10,
    description: 'Granat ręczny odłamkowy (Mills, Stielhandgranate). Obrażenia: 4K6/3 m.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'legitymacja_wojskowa',
    name: 'Legitymacja wojskowa',
    price: 0,
    description: 'Legitymacja służbowa — dowód przynależności do sił zbrojnych. Ułatwia kontakty z wojskiem i policją.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'menazka',
    name: 'Menażka',
    price: 1,
    description: 'Menażka (kociołek polowy) do przygotowywania posiłków w terenie.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'sygnalow_pistolet',
    name: 'Pistolet sygnałowy',
    price: 10,
    description: 'Pistolet sygnałowy z racami (3 szt.). Służy do sygnalizacji.',
    tag: '[Wojsko]',
    fromService: true,
  },
  {
    id: 'drut_kolczasty_rolka',
    name: 'Drut kolczasty (rolka)',
    price: 3,
    description: 'Rolka drutu kolczastego, ok. 15 m. Wykorzystywana do tworzenia zapór.',
    tag: '[Wojsko]',
  },
]
