/**
 * English translations of occupation names for use in image generation
 * prompts (sent to Gemini). Polish display names live in OCCUPATIONS;
 * this map gives 1920s-era-appropriate English profession terms suitable
 * for inclusion in prompts like "...lawyer by profession in 1920s".
 *
 * One entry per occupation in src/data/occupations.ts (111 entries).
 * Keep terms idiomatic and concise — Gemini reads them as cues for
 * clothing, posture, and props, so use the term that maximises
 * visual recognition (e.g. "private detective" not "private investigator").
 */
export const OCCUPATION_NAMES_EN: Record<string, string> = {
  // law_enforcement
  agent_federalny: 'federal agent',
  detektyw_agencji: 'agency detective',
  detektyw_policyjny: 'police detective',
  lowca_nagrod: 'bounty hunter',
  oficer_policji: 'police officer',
  prawnik: 'lawyer',
  prywatny_detektyw: 'private detective',
  sedzia: 'judge',

  // medical (forensic) / military
  alienista: 'alienist',
  lekarz_medycyny_sadowej: 'forensic pathologist',
  oficer_wojskowy: 'military officer',
  wojskowy_zolnierz: 'soldier',
  strazak: 'firefighter',
  szpieg: 'spy',
  pilot_akrobacyjny: 'stunt pilot',

  // medical
  farmaceuta: 'pharmacist',
  lekarz: 'doctor',
  pielegniarka: 'nurse',
  psychiatra: 'psychiatrist',
  sanitariusz_w_szpitalu_psychiatrycznym: 'asylum orderly',
  salowy: 'hospital orderly',
  psycholog_psychoanalityk: 'psychoanalyst',

  // science_education
  antykwariusz: 'antiquarian',
  archeolog: 'archaeologist',
  architekt: 'architect',
  bibliotekarz: 'librarian',
  ksiegarz: 'bookseller',
  kustosz: 'museum curator',
  laborant: 'lab technician',
  naukowiec: 'scientist',
  parapsycholog: 'parapsychologist',
  pracownik_naukowy: 'research fellow',
  profesor: 'professor',
  student_stazysta: 'graduate student',

  // arts_entertainment
  aktor: 'actor',
  artysta: 'artist',
  artysta_estradowy: 'stage performer',
  dziennikarz: 'journalist',
  dziennikarz_sledczy: 'investigative journalist',
  reporter: 'newspaper reporter',
  fotograf: 'photographer',
  korespondent_zagraniczny: 'foreign correspondent',
  muzyk: 'jazz musician',
  pisarz: 'novelist',
  redaktor: 'newspaper editor',
  gwiazda_filmowa: 'silent film star',

  // crime_underworld
  fanatyk: 'fanatic',
  hazardzista: 'gambler',
  prostytutka: 'prostitute',
  przestepca: 'criminal',
  szmugler: 'smuggler',
  gangster_przywodca: 'mob boss',
  gangster_podwladny: 'gangster henchman',
  dziewczyna_gangstera: 'gangster moll',
  falszerz: 'forger',
  oszust: 'con artist',
  paser: 'fence',
  przemytnik_alkoholu_bandyta: 'bootlegger',
  rabus: 'robber',
  uliczny_chuligan: 'street thug',
  wlamywacz: 'burglar',
  zabojca: 'hitman',

  // nature_travel
  czlowiek_plemienny: 'tribal native',
  farmer: 'farmer',
  kierowca: 'driver',
  kowboj: 'cowboy',
  lowca_grubego_zwierza: 'big game hunter',
  marynarz: 'sailor',
  nurek: 'deep sea diver',
  odkrywca: 'explorer',
  pilot: 'aviator',
  poszukiwacz: 'prospector',
  traper: 'trapper',
  wspinacz_wysokogorski: 'mountaineer',

  // trade_services
  barman: 'speakeasy bartender',
  bogaty_hobbysta: 'wealthy dilettante',
  dzentelmen_dama: 'gentleman or lady',
  kamerdyner_lokaj_pokojowka: 'butler',
  kelner: 'waiter',
  komiwojazer: 'travelling salesman',
  opiekun_zwierzat_w_zoo: 'zookeeper',
  przedsiebiorca_pogrzebowy: 'undertaker',
  sklepikarz: 'shopkeeper',
  tramp: 'hobo',
  treser: 'animal trainer',
  wloczega: 'vagrant',
  handlarz_antykami: 'antiques dealer',
  szofer: 'chauffeur',
  taksowkarz: 'taxi driver',

  // administration
  dzialacz_zwiazkowy: 'union organiser',
  funkcjonariusz_publiczny: 'civil servant',
  ksiegowy: 'accountant',
  pracownik_umyslowy: 'office clerk',
  sekretarz: 'secretary',

  // religion_occult
  duchowny: 'clergyman',
  misjonarz: 'missionary',
  okultysta: 'occult scholar',
  przywodca_kultu: 'cult leader',

  // sports_action
  akrobata: 'circus acrobat',
  bokser_zapasnik: 'prizefighter',
  kaskader: 'stunt performer',
  sportowiec: 'athlete',

  // technical
  inzynier: 'engineer',
  mechanik: 'mechanic',
  pracownik_fizyczny: 'skilled labourer',
  programista_haker: 'computer programmer',
  projektant: 'industrial designer',
  rekodzielnik: 'craftsman',
  drwal: 'lumberjack',
  gornik: 'coal miner',
  pracownik_fizyczny_niewykwalifikowany: 'unskilled labourer',

  // wild_west — 26 frontier-era occupations (IDs prefixed `ww_`).
  // Terms chosen for SDXL visual recall (e.g. "outlaw" not "criminal",
  // "lawman" not "sheriff" since the role covers marshal/deputy too).
  ww_artysta: 'artist',
  ww_oszust: 'confidence trickster',
  ww_kowboj: 'cowboy',
  ww_rzemieslnik: 'craftsman',
  ww_zoltodziob: 'wealthy easterner',
  ww_lekarz: 'doctor',
  ww_artysta_sceniczny: 'stage performer',
  ww_kurier: 'expressman',
  ww_farmer: 'farmer',
  ww_hazardzista: 'gambler',
  ww_rewolwerowiec: 'gunfighter',
  ww_wloczega: 'drifter',
  ww_dziennikarz: 'journalist',
  ww_straznik_prawa: 'lawman',
  ww_prawnik: 'lawyer',
  ww_duchowny: 'preacher',
  ww_kupiec: 'merchant',
  ww_poszukiwacz: 'prospector',
  ww_bandyta: 'outlaw',
  ww_polityk: 'politician',
  ww_ranczer: 'rancher',
  ww_uczony: 'scholar',
  ww_naukowiec: 'scientist',
  ww_zwiadowca: 'scout',
  ww_zolnierz: 'soldier',
  ww_robotnik: 'unskilled laborer',
}
