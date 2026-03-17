export type OccupationContactType = 'sieciowy' | 'przeciętny' | 'izolowany'

export interface OccupationContactProfile {
  type: OccupationContactType
  natural_subcategories: string[]
}

export const OCCUPATION_CONTACT_MAP: Record<string, OccupationContactProfile> = {
  // ── Prawo i porządek ────────────────────────────────────────
  agent_federalny: {
    type: 'sieciowy',
    natural_subcategories: ['sluzby_specjalne', 'policja_miejska', 'sluzby_celne'],
  },
  detektyw_agencji: {
    type: 'sieciowy',
    natural_subcategories: ['detektywi_prywatni', 'policja_miejska', 'plotkarze'],
  },
  detektyw_policyjny: {
    type: 'sieciowy',
    natural_subcategories: ['policja_miejska', 'prokuratura_sady', 'gangi_uliczne'],
  },
  prawnik: {
    type: 'sieciowy',
    natural_subcategories: ['prawnicy', 'prokuratura_sady', 'politycy'],
  },
  prywatny_detektyw: {
    type: 'przeciętny',
    natural_subcategories: ['detektywi_prywatni', 'policja_miejska', 'plotkarze'],
  },
  sedzia: {
    type: 'sieciowy',
    natural_subcategories: ['prokuratura_sady', 'prawnicy', 'politycy'],
  },

  // ── Wojsko i służby ─────────────────────────────────────────
  oficer_wojskowy: {
    type: 'sieciowy',
    natural_subcategories: ['oficerowie', 'weterani', 'dostawcy_wojsk'],
  },
  wojskowy_zolnierz: {
    type: 'przeciętny',
    natural_subcategories: ['weterani', 'jednostki_rez'],
  },
  szpieg: {
    type: 'sieciowy',
    natural_subcategories: ['sluzby_specjalne', 'dyplomaci', 'przemytnicy'],
  },
  strazak: {
    type: 'przeciętny',
    natural_subcategories: ['policja_miejska', 'personel_szpitalny'],
  },

  // ── Medycyna ────────────────────────────────────────────────
  lekarz: {
    type: 'sieciowy',
    natural_subcategories: ['lekarze', 'personel_szpitalny', 'farmaceuci', 'patolodzy'],
  },
  psychiatra: {
    type: 'sieciowy',
    natural_subcategories: ['psychiatrzy', 'lekarze', 'profesorowie'],
  },
  farmaceuta: {
    type: 'przeciętny',
    natural_subcategories: ['farmaceuci', 'lekarze'],
  },
  pielegniarka: {
    type: 'przeciętny',
    natural_subcategories: ['personel_szpitalny', 'lekarze'],
  },

  // ── Prasa i media ───────────────────────────────────────────
  dziennikarz: {
    type: 'sieciowy',
    natural_subcategories: ['dziennikarze', 'wydawcy', 'plotkarze', 'politycy'],
  },
  korespondent_zagraniczny: {
    type: 'sieciowy',
    natural_subcategories: ['dziennikarze', 'dyplomaci', 'fotografowie'],
  },
  redaktor: {
    type: 'sieciowy',
    natural_subcategories: ['wydawcy', 'dziennikarze', 'plotkarze'],
  },
  fotograf: {
    type: 'przeciętny',
    natural_subcategories: ['fotografowie', 'dziennikarze'],
  },

  // ── Przestępczość ───────────────────────────────────────────
  gangster: {
    type: 'sieciowy',
    natural_subcategories: ['gangi_uliczne', 'przemytnicy', 'hazard_domy_gry', 'lichwiarze'],
  },
  szmugler: {
    type: 'sieciowy',
    natural_subcategories: ['przemytnicy', 'paserzy', 'sluzby_celne'],
  },
  hazardzista: {
    type: 'przeciętny',
    natural_subcategories: ['hazard_domy_gry', 'lichwiarze', 'rozrywka_domy'],
  },

  // ── Handel i usługi ─────────────────────────────────────────
  komiwojazer: {
    type: 'sieciowy',
    natural_subcategories: ['przemyslowcy', 'bankierzy', 'plotkarze'],
  },
  barman: {
    type: 'sieciowy',
    natural_subcategories: ['plotkarze', 'gangi_uliczne', 'rozrywka_domy'],
  },
  bogaty_hobbysta: {
    type: 'sieciowy',
    natural_subcategories: ['kluby_dzentelmenow', 'towarzystwa_naukowe', 'bankierzy', 'muzea_kolekcjonerzy'],
  },
  dzentelmen_dama: {
    type: 'sieciowy',
    natural_subcategories: ['kluby_dzentelmenow', 'loze_masony', 'politycy', 'stowarzyszenia_charytat'],
  },
  sklepikarz: {
    type: 'przeciętny',
    natural_subcategories: ['bankierzy', 'plotkarze'],
  },
  kamerdyner_lokaj_pokojowka: {
    type: 'izolowany',
    natural_subcategories: ['kluby_dzentelmenow', 'plotkarze'],
  },
  sekretarz: {
    type: 'przeciętny',
    natural_subcategories: ['politycy', 'plotkarze'],
  },

  // ── Religia i okultyzm ──────────────────────────────────────
  duchowny: {
    type: 'sieciowy',
    natural_subcategories: ['stowarzyszenia_charytat', 'duchowni_wiejscy', 'straz_wiezienna'],
  },
  misjonarz: {
    type: 'przeciętny',
    natural_subcategories: ['stowarzyszenia_charytat', 'towarzystwa_podroz', 'eksperci_folkloru'],
  },
  okultysta: {
    type: 'przeciętny',
    natural_subcategories: ['spirytysci', 'tajne_bractwa', 'handlarze_ksiag', 'kolekcjonerzy_ant'],
  },
  przywodca_kultu: {
    type: 'sieciowy',
    natural_subcategories: ['tajne_bractwa', 'spirytysci', 'srodowiska_imigrantow'],
  },
  parapsycholog: {
    type: 'przeciętny',
    natural_subcategories: ['spirytysci', 'profesorowie', 'eksperci_folkloru'],
  },

  // ── Nauka i edukacja ────────────────────────────────────────
  archeolog: {
    type: 'sieciowy',
    natural_subcategories: ['muzea_kolekcjonerzy', 'profesorowie', 'towarzystwa_podroz', 'towarzystwa_naukowe'],
  },
  antykwariusz: {
    type: 'przeciętny',
    natural_subcategories: ['muzea_kolekcjonerzy', 'antykwariusze_bibliofile', 'kolekcjonerzy_ant', 'handlarze_ksiag'],
  },
  bibliotekarz: {
    type: 'izolowany',
    natural_subcategories: ['archiwisci', 'antykwariusze_bibliofile', 'profesorowie', 'handlarze_ksiag'],
  },
  kustosz: {
    type: 'przeciętny',
    natural_subcategories: ['muzea_kolekcjonerzy', 'archiwisci', 'antykwariusze_bibliofile', 'kolekcjonerzy_ant'],
  },
  laborant: {
    type: 'izolowany',
    natural_subcategories: ['instytuty', 'personel_szpitalny'],
  },
  naukowiec: {
    type: 'przeciętny',
    natural_subcategories: ['profesorowie', 'instytuty', 'towarzystwa_naukowe'],
  },
  pracownik_naukowy: {
    type: 'przeciętny',
    natural_subcategories: ['instytuty', 'profesorowie'],
  },
  profesor: {
    type: 'sieciowy',
    natural_subcategories: ['profesorowie', 'towarzystwa_naukowe', 'archiwisci', 'wydawcy'],
  },
  pisarz: {
    type: 'przeciętny',
    natural_subcategories: ['wydawcy', 'towarzystwa_lit', 'dziennikarze', 'antykwariusze_bibliofile'],
  },

  // ── Sztuka i rozrywka ───────────────────────────────────────
  aktor: {
    type: 'sieciowy',
    natural_subcategories: ['towarzystwa_lit', 'plotkarze', 'kluby_dzentelmenow'],
  },
  artysta: {
    type: 'przeciętny',
    natural_subcategories: ['towarzystwa_lit', 'wydawcy', 'srodowiska_imigrantow'],
  },
  artysta_estradowy: {
    type: 'przeciętny',
    natural_subcategories: ['rozrywka_domy', 'plotkarze', 'towarzystwa_lit'],
  },
  muzyk: {
    type: 'przeciętny',
    natural_subcategories: ['rozrywka_domy', 'plotkarze', 'towarzystwa_lit'],
  },

  // ── Administracja ───────────────────────────────────────────
  funkcjonariusz_publiczny: {
    type: 'sieciowy',
    natural_subcategories: ['politycy', 'prawnicy', 'policja_miejska'],
  },
  dzialacz_zwiazkowy: {
    type: 'sieciowy',
    natural_subcategories: ['przemyslowcy', 'politycy', 'gangi_uliczne'],
  },

  // ── Sport i czyn ────────────────────────────────────────────
  bokser_zapasnik: {
    type: 'przeciętny',
    natural_subcategories: ['kluby_sportowe', 'gangi_uliczne', 'plotkarze'],
  },
  sportowiec: {
    type: 'przeciętny',
    natural_subcategories: ['kluby_sportowe', 'dziennikarze', 'plotkarze'],
  },

  // ── Technika ────────────────────────────────────────────────
  architekt: {
    type: 'przeciętny',
    natural_subcategories: ['przemyslowcy', 'instytuty', 'wlasciciele_ziemscy'],
  },
  inzynier: {
    type: 'przeciętny',
    natural_subcategories: ['instytuty', 'przemyslowcy', 'dostawcy_wojsk'],
  },
  mechanik: {
    type: 'izolowany',
    natural_subcategories: ['dostawcy_wojsk', 'przemyslowcy'],
  },

  // ── Przyroda i podróże ──────────────────────────────────────
  kierowca: {
    type: 'przeciętny',
    natural_subcategories: ['przemytnicy', 'plotkarze'],
  },
  pilot: {
    type: 'przeciętny',
    natural_subcategories: ['oficerowie', 'dostawcy_wojsk', 'towarzystwa_podroz'],
  },

  // ── Fallback ────────────────────────────────────────────────
  _default: {
    type: 'przeciętny',
    natural_subcategories: ['plotkarze', 'kluby_sportowe'],
  },
}
