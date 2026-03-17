export interface ContactSubcategoryV2 {
  id: string
  name: string
  category: string
  base_strength: 1 | 2 | 3
  natural_for_occupations: string[]
}

export const CONTACT_CATEGORIES_V2 = [
  'PRAWO I SŁUŻBY MUNDUROWE',
  'PÓŁŚWIATEK',
  'AKADEMIA I WIEDZA',
  'PRASA I MEDIA',
  'MEDYCYNA',
  'WŁADZA I BIZNES',
  'TOWARZYSTWO I KLUBY',
  'WOJSKO I WETERANI',
  'OKULTYZM I TAJNE KRĘGI',
] as const

export const CONTACT_SUBCATEGORIES_V2: ContactSubcategoryV2[] = [
  // PRAWO I SŁUŻBY MUNDUROWE (6)
  { id: 'policja_miejska', name: 'Policja miejska', category: 'PRAWO I SŁUŻBY MUNDUROWE', base_strength: 1,
    natural_for_occupations: ['detektyw_agencji', 'prywatny_detektyw', 'dziennikarz', 'prawnik', 'agent_federalny'] },
  { id: 'detektywi_prywatni', name: 'Detektywi prywatni', category: 'PRAWO I SŁUŻBY MUNDUROWE', base_strength: 1,
    natural_for_occupations: ['detektyw_agencji', 'prywatny_detektyw', 'lowca_nagrod'] },
  { id: 'prokuratura_sady', name: 'Prokuratura i sądy', category: 'PRAWO I SŁUŻBY MUNDUROWE', base_strength: 1,
    natural_for_occupations: ['prawnik', 'sedzia', 'detektyw_policyjny', 'lekarz'] },
  { id: 'sluzby_celne', name: 'Służby celne i graniczne', category: 'PRAWO I SŁUŻBY MUNDUROWE', base_strength: 1,
    natural_for_occupations: ['agent_federalny', 'szpieg', 'szmugler'] },
  { id: 'sluzby_specjalne', name: 'Służby specjalne / wywiad', category: 'PRAWO I SŁUŻBY MUNDUROWE', base_strength: 1,
    natural_for_occupations: ['szpieg', 'agent_federalny', 'oficer_wojskowy'] },
  { id: 'straz_wiezienna', name: 'Straż więzienna', category: 'PRAWO I SŁUŻBY MUNDUROWE', base_strength: 1,
    natural_for_occupations: ['prawnik', 'duchowny', 'pielegniarka'] },

  // PÓŁŚWIATEK (6)
  { id: 'gangi_uliczne', name: 'Gangi uliczne', category: 'PÓŁŚWIATEK', base_strength: 1,
    natural_for_occupations: ['gangster', 'przestepca', 'kieszonkowiec', 'dziennikarz', 'detektyw_agencji'] },
  { id: 'przemytnicy', name: 'Przemytnicy (alkohol, towary)', category: 'PÓŁŚWIATEK', base_strength: 1,
    natural_for_occupations: ['szmugler', 'gangster', 'barman'] },
  { id: 'hazard_domy_gry', name: 'Hazard i domy gry', category: 'PÓŁŚWIATEK', base_strength: 1,
    natural_for_occupations: ['hazardzista', 'gangster', 'pisarz', 'muzyk', 'barman'] },
  { id: 'paserzy', name: 'Paserzy i czarny rynek', category: 'PÓŁŚWIATEK', base_strength: 1,
    natural_for_occupations: ['przestepca', 'kieszonkowiec', 'detektyw_agencji'] },
  { id: 'rozrywka_domy', name: 'Rozrywka i domy schadzek', category: 'PÓŁŚWIATEK', base_strength: 1,
    natural_for_occupations: ['prostytutka', 'gangster', 'muzyk', 'barman'] },
  { id: 'lichwiarze', name: 'Lichwiarze i wymuszone długi', category: 'PÓŁŚWIATEK', base_strength: 1,
    natural_for_occupations: ['gangster', 'przestepca', 'hazardzista'] },

  // AKADEMIA I WIEDZA (6)
  { id: 'profesorowie', name: 'Profesorowie i wykładowcy', category: 'AKADEMIA I WIEDZA', base_strength: 1,
    natural_for_occupations: ['profesor', 'naukowiec', 'archeolog', 'pisarz', 'parapsycholog', 'bibliotekarz'] },
  { id: 'archiwisci', name: 'Archiwiści i bibliotekarze', category: 'AKADEMIA I WIEDZA', base_strength: 1,
    natural_for_occupations: ['bibliotekarz', 'profesor', 'pisarz', 'archeolog'] },
  { id: 'muzea_kolekcjonerzy', name: 'Muzea i kolekcjonerzy', category: 'AKADEMIA I WIEDZA', base_strength: 1,
    natural_for_occupations: ['kustosz', 'antykwariusz', 'archeolog', 'bogaty_hobbysta'] },
  { id: 'instytuty', name: 'Instytuty badawcze', category: 'AKADEMIA I WIEDZA', base_strength: 1,
    natural_for_occupations: ['naukowiec', 'profesor', 'inzynier', 'laborant', 'pracownik_naukowy'] },
  { id: 'towarzystwa_naukowe', name: 'Towarzystwa naukowe', category: 'AKADEMIA I WIEDZA', base_strength: 1,
    natural_for_occupations: ['profesor', 'archeolog', 'bogaty_hobbysta', 'odkrywca'] },
  { id: 'eksperci_sadowi', name: 'Eksperci sądowi i biegli', category: 'AKADEMIA I WIEDZA', base_strength: 1,
    natural_for_occupations: ['lekarz', 'prawnik', 'naukowiec'] },

  // PRASA I MEDIA (5)
  { id: 'dziennikarze', name: 'Dziennikarze i reporterzy', category: 'PRASA I MEDIA', base_strength: 1,
    natural_for_occupations: ['dziennikarz', 'redaktor', 'korespondent_zagraniczny', 'pisarz'] },
  { id: 'wydawcy', name: 'Wydawcy i redaktorzy', category: 'PRASA I MEDIA', base_strength: 1,
    natural_for_occupations: ['pisarz', 'redaktor', 'dziennikarz'] },
  { id: 'fotografowie', name: 'Fotografowie prasowi', category: 'PRASA I MEDIA', base_strength: 1,
    natural_for_occupations: ['fotograf', 'dziennikarz', 'korespondent_zagraniczny'] },
  { id: 'radio', name: 'Radio i nowe media', category: 'PRASA I MEDIA', base_strength: 1,
    natural_for_occupations: ['dziennikarz', 'redaktor', 'muzyk'] },
  { id: 'plotkarze', name: 'Plotkarze i informatorzy', category: 'PRASA I MEDIA', base_strength: 1,
    natural_for_occupations: ['dziennikarz', 'detektyw_agencji', 'barman', 'kelner'] },

  // MEDYCYNA (5)
  { id: 'lekarze', name: 'Lekarze i chirurdzy', category: 'MEDYCYNA', base_strength: 1,
    natural_for_occupations: ['lekarz', 'psychiatra'] },
  { id: 'psychiatrzy', name: 'Psychiatrzy i psycholodzy', category: 'MEDYCYNA', base_strength: 1,
    natural_for_occupations: ['psychiatra', 'lekarz'] },
  { id: 'patolodzy', name: 'Patolodzy i medycyna sądowa', category: 'MEDYCYNA', base_strength: 1,
    natural_for_occupations: ['lekarz', 'detektyw_policyjny'] },
  { id: 'farmaceuci', name: 'Farmaceuci i aptekarze', category: 'MEDYCYNA', base_strength: 1,
    natural_for_occupations: ['farmaceuta', 'lekarz', 'pielegniarka'] },
  { id: 'personel_szpitalny', name: 'Personel szpitalny', category: 'MEDYCYNA', base_strength: 1,
    natural_for_occupations: ['pielegniarka', 'salowy', 'sanitariusz_w_szpitalu_psychiatrycznym', 'lekarz'] },

  // WŁADZA I BIZNES (5)
  { id: 'politycy', name: 'Politycy i urzędnicy miejscy', category: 'WŁADZA I BIZNES', base_strength: 1,
    natural_for_occupations: ['prawnik', 'dziennikarz', 'funkcjonariusz_publiczny', 'sedzia', 'dzialacz_zwiazkowy'] },
  { id: 'bankierzy', name: 'Bankierzy i finansiści', category: 'WŁADZA I BIZNES', base_strength: 1,
    natural_for_occupations: ['ksiegowy', 'prawnik', 'bogaty_hobbysta', 'dzentelmen_dama'] },
  { id: 'przemyslowcy', name: 'Przemysłowcy i fabrykanci', category: 'WŁADZA I BIZNES', base_strength: 1,
    natural_for_occupations: ['bogaty_hobbysta', 'inzynier', 'dzialacz_zwiazkowy'] },
  { id: 'prawnicy', name: 'Prawnicy i notariusze', category: 'WŁADZA I BIZNES', base_strength: 1,
    natural_for_occupations: ['prawnik', 'sedzia', 'bogaty_hobbysta'] },
  { id: 'dyplomaci', name: 'Dyplomaci i konsulaty', category: 'WŁADZA I BIZNES', base_strength: 1,
    natural_for_occupations: ['szpieg', 'korespondent_zagraniczny', 'odkrywca', 'dzentelmen_dama'] },

  // TOWARZYSTWO I KLUBY (6)
  { id: 'kluby_dzentlemenow', name: 'Kluby dżentelmenów', category: 'TOWARZYSTWO I KLUBY', base_strength: 1,
    natural_for_occupations: ['dzentelmen_dama', 'bogaty_hobbysta', 'prawnik', 'lekarz'] },
  { id: 'loze_masony', name: 'Loże masońskie i bractwa', category: 'TOWARZYSTWO I KLUBY', base_strength: 1,
    natural_for_occupations: ['dzentelmen_dama', 'prawnik', 'bogaty_hobbysta', 'funkcjonariusz_publiczny'] },
  { id: 'towarzystwa_podroz', name: 'Towarzystwa podróżnicze', category: 'TOWARZYSTWO I KLUBY', base_strength: 1,
    natural_for_occupations: ['odkrywca', 'bogaty_hobbysta', 'archeolog', 'dzentelmen_dama'] },
  { id: 'kluby_sportowe', name: 'Kluby sportowe (golf, tenis, polo)', category: 'TOWARZYSTWO I KLUBY', base_strength: 1,
    natural_for_occupations: ['dzentelmen_dama', 'bogaty_hobbysta', 'sportowiec'] },
  { id: 'towarzystwa_lit', name: 'Towarzystwa literackie i artystyczne', category: 'TOWARZYSTWO I KLUBY', base_strength: 1,
    natural_for_occupations: ['pisarz', 'artysta', 'muzyk', 'profesor', 'bogaty_hobbysta'] },
  { id: 'stowarzyszenia_charytat', name: 'Stowarzyszenia charytatywne', category: 'TOWARZYSTWO I KLUBY', base_strength: 1,
    natural_for_occupations: ['duchowny', 'dzentelmen_dama', 'lekarz', 'pielegniarka'] },

  // WOJSKO I WETERANI (4)
  { id: 'oficerowie', name: 'Oficerowie czynni', category: 'WOJSKO I WETERANI', base_strength: 1,
    natural_for_occupations: ['oficer_wojskowy', 'agent_federalny', 'szpieg'] },
  { id: 'weterani', name: 'Weterani i stowarzyszenia kombatantów', category: 'WOJSKO I WETERANI', base_strength: 1,
    natural_for_occupations: ['wojskowy_zolnierz', 'oficer_wojskowy', 'detektyw_agencji', 'lowca_nagrod'] },
  { id: 'jednostki_rez', name: 'Jednostki rezerwowe', category: 'WOJSKO I WETERANI', base_strength: 1,
    natural_for_occupations: ['oficer_wojskowy', 'wojskowy_zolnierz'] },
  { id: 'dostawcy_wojsk', name: 'Dostawcy wojskowi i uzbrojenie', category: 'WOJSKO I WETERANI', base_strength: 1,
    natural_for_occupations: ['oficer_wojskowy', 'inzynier', 'gangster', 'szmugler'] },

  // OKULTYZM I TAJNE KRĘGI (5)
  { id: 'spirytysci', name: 'Spirytyści i medium', category: 'OKULTYZM I TAJNE KRĘGI', base_strength: 1,
    natural_for_occupations: ['okultysta', 'parapsycholog', 'przywodca_kultu', 'duchowny'] },
  { id: 'kolekcjonerzy_ant', name: 'Kolekcjonerzy antyków i osobliwości', category: 'OKULTYZM I TAJNE KRĘGI', base_strength: 1,
    natural_for_occupations: ['antykwariusz', 'kustosz', 'bogaty_hobbysta', 'okultysta'] },
  { id: 'tajne_bractwa', name: 'Tajne bractwa i loże ezoteryczne', category: 'OKULTYZM I TAJNE KRĘGI', base_strength: 1,
    natural_for_occupations: ['okultysta', 'przywodca_kultu', 'fanatyk'] },
  { id: 'eksperci_folkloru', name: 'Eksperci folkloru i legend', category: 'OKULTYZM I TAJNE KRĘGI', base_strength: 1,
    natural_for_occupations: ['profesor', 'misjonarz', 'parapsycholog'] },
  { id: 'handlarze_ksiag', name: 'Handlarze rzadkimi księgami', category: 'OKULTYZM I TAJNE KRĘGI', base_strength: 1,
    natural_for_occupations: ['okultysta', 'bibliotekarz', 'antykwariusz', 'pisarz', 'naukowiec'] },
]
