/**
 * Equipment Catalog v2 — Standard equipment (excluding weapons/ammo)
 * Era: Klasyczna (lata 20. XX wieku)
 */

export interface EquipmentItemV2 {
  id: string
  name: string
  price: number        // in dollars
  category: string
  dailyMaintenance?: number  // for vehicles only
}

export const EQUIPMENT_CATEGORIES_V2 = [
  'vehicles',
  'light',
  'optics',
  'photo',
  'communication',
  'travel',
  'tools',
  'medical',
  'misc',
] as const

export const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  vehicles: 'Pojazdy',
  light: 'Światło',
  optics: 'Optyka',
  photo: 'Fotografia',
  communication: 'Komunikacja',
  travel: 'Podróż',
  tools: 'Narzędzia',
  medical: 'Medyczne',
  misc: 'Rozmaitości',
}

export const EQUIPMENT_CATALOG_V2: EquipmentItemV2[] = [
  // === Pojazdy ===
  { id: 'zuzyty_motocykl', name: 'Zużyty motocykl', price: 50, category: 'vehicles', dailyMaintenance: 0.05 },
  { id: 'motocykl', name: 'Motocykl', price: 120, category: 'vehicles', dailyMaintenance: 0.10 },
  { id: 'swietny_motocykl', name: 'Świetny motocykl', price: 220, category: 'vehicles', dailyMaintenance: 0.15 },
  { id: 'zuzyty_samochod', name: 'Zużyty samochód', price: 180, category: 'vehicles', dailyMaintenance: 0.15 },
  { id: 'przecietne_auto', name: 'Przeciętne auto', price: 450, category: 'vehicles', dailyMaintenance: 0.25 },
  { id: 'dobre_auto', name: 'Dobre auto', price: 1200, category: 'vehicles', dailyMaintenance: 0.50 },
  { id: 'luksusowe_auto', name: 'Luksusowe auto', price: 3000, category: 'vehicles', dailyMaintenance: 0.80 },

  // === Światło ===
  { id: 'swiece_6szt', name: 'Świece (6 szt.)', price: 0.25, category: 'light' },
  { id: 'swiece_w_latarni', name: 'Świece w latarni', price: 1, category: 'light' },
  { id: 'flara_6szt', name: 'Flara (6 szt.)', price: 1, category: 'light' },
  { id: 'lampa_naftowa_mala', name: 'Lampa naftowa (mała)', price: 2, category: 'light' },
  { id: 'lampa_naftowa_duza', name: 'Lampa naftowa (duża)', price: 5, category: 'light' },
  { id: 'latarka_mala', name: 'Latarka (mała)', price: 3, category: 'light' },
  { id: 'latarka_duza', name: 'Latarka (duża)', price: 5, category: 'light' },
  { id: 'lampa_karbidowa', name: 'Lampa karbidowa', price: 4, category: 'light' },
  { id: 'pochodnia', name: 'Pochodnia', price: 0.50, category: 'light' },
  { id: 'zapalki_pudelko', name: 'Zapałki (pudełko)', price: 0.05, category: 'light' },
  { id: 'zapalniczka', name: 'Zapalniczka', price: 1, category: 'light' },
  { id: 'reflektor_przenozny', name: 'Reflektor przenośny', price: 15, category: 'light' },

  // === Optyka ===
  { id: 'monokl', name: 'Monokl', price: 3, category: 'optics' },
  { id: 'mikroskop_prosty', name: 'Mikroskop (prosty)', price: 15, category: 'optics' },
  { id: 'mikroskop_laboratoryjny', name: 'Mikroskop laboratoryjny', price: 75, category: 'optics' },
  { id: 'luneta_mala', name: 'Luneta (mała)', price: 5, category: 'optics' },
  { id: 'luneta_duza', name: 'Luneta (duża)', price: 15, category: 'optics' },
  { id: 'lornetka_polowa', name: 'Lornetka polowa', price: 10, category: 'optics' },
  { id: 'lornetka_teatralna', name: 'Lornetka teatralna', price: 5, category: 'optics' },
  { id: 'lupa', name: 'Lupa', price: 1, category: 'optics' },
  { id: 'okulary', name: 'Okulary', price: 3, category: 'optics' },
  { id: 'okulary_sloneczne', name: 'Okulary słoneczne', price: 5, category: 'optics' },

  // === Fotografia ===
  { id: 'blona_fotograficzna', name: 'Błona fotograficzna (rolka)', price: 0.50, category: 'photo' },
  { id: 'film_kinowy_rolka', name: 'Film kinowy (rolka)', price: 5, category: 'photo' },
  { id: 'aparat_prosty', name: 'Aparat fotograficzny (prosty)', price: 5, category: 'photo' },
  { id: 'aparat_dobry', name: 'Aparat fotograficzny (dobry)', price: 25, category: 'photo' },
  { id: 'aparat_profesjonalny', name: 'Aparat fotograficzny (profesjonalny)', price: 75, category: 'photo' },
  { id: 'dyktafon', name: 'Dyktafon', price: 50, category: 'photo' },
  { id: 'kamera_filmowa', name: 'Kamera filmowa', price: 200, category: 'photo' },
  { id: 'spadochron', name: 'Spadochron', price: 100, category: 'photo' },

  // === Komunikacja ===
  { id: 'pocztowka', name: 'Pocztówka ze znaczkiem', price: 0.05, category: 'communication' },
  { id: 'gazeta', name: 'Gazeta', price: 0.05, category: 'communication' },
  { id: 'telegraf_wiadomosc', name: 'Telegraf (wiadomość)', price: 0.50, category: 'communication' },
  { id: 'telefon_polaczenie_lokalne', name: 'Telefon — połączenie lokalne', price: 0.10, category: 'communication' },
  { id: 'telefon_polaczenie_miedzymiast', name: 'Telefon — połączenie międzymiastowe', price: 1, category: 'communication' },
  { id: 'telefon_aparat', name: 'Aparat telefoniczny', price: 15, category: 'communication' },
  { id: 'radio_odbiornik', name: 'Radio (odbiornik)', price: 25, category: 'communication' },
  { id: 'radio_nadawczo_odbiorcze', name: 'Radio nadawczo-odbiorcze', price: 75, category: 'communication' },

  // === Podróż ===
  { id: 'buklak', name: 'Bukłak', price: 1, category: 'travel' },
  { id: 'termos', name: 'Termos', price: 2, category: 'travel' },
  { id: 'namiot_1os', name: 'Namiot (1-osobowy)', price: 5, category: 'travel' },
  { id: 'namiot_4os', name: 'Namiot (4-osobowy)', price: 15, category: 'travel' },
  { id: 'namiot_8os', name: 'Namiot (8-osobowy)', price: 30, category: 'travel' },
  { id: 'lozko_polowe', name: 'Łóżko polowe', price: 3, category: 'travel' },
  { id: 'spiwor', name: 'Śpiwór', price: 5, category: 'travel' },
  { id: 'canoe', name: 'Canoe', price: 25, category: 'travel' },
  { id: 'walizka', name: 'Walizka', price: 3, category: 'travel' },
  { id: 'kufer_podruzny', name: 'Kufer podróżny', price: 10, category: 'travel' },
  { id: 'plecak', name: 'Plecak', price: 2, category: 'travel' },
  { id: 'torba_podrozna', name: 'Torba podróżna', price: 3, category: 'travel' },
  { id: 'mapa_regionalna', name: 'Mapa regionalna', price: 0.50, category: 'travel' },

  // === Narzędzia ===
  { id: 'lopata', name: 'Łopata', price: 1, category: 'tools' },
  { id: 'lom', name: 'Łom', price: 1, category: 'tools' },
  { id: 'lina_15m', name: 'Lina (15 m)', price: 1, category: 'tools' },
  { id: 'lina_30m', name: 'Lina (30 m)', price: 2, category: 'tools' },
  { id: 'wiertarka_reczna', name: 'Wiertarka ręczna', price: 3, category: 'tools' },
  { id: 'pila_reczna', name: 'Piła ręczna', price: 2, category: 'tools' },
  { id: 'mlot', name: 'Młot', price: 1, category: 'tools' },
  { id: 'gwozdzie_pudelko', name: 'Gwoździe (pudełko)', price: 0.25, category: 'tools' },
  { id: 'sruby_pudelko', name: 'Śruby (pudełko)', price: 0.50, category: 'tools' },
  { id: 'lancuch_3m', name: 'Łańcuch (3 m)', price: 2, category: 'tools' },
  { id: 'klodka', name: 'Kłódka', price: 1, category: 'tools' },
  { id: 'wytrychy', name: 'Wytrychy', price: 10, category: 'tools' },
  { id: 'siekiera', name: 'Siekiera', price: 2, category: 'tools' },
  { id: 'kolki_drewniane', name: 'Kołki drewniane (6 szt.)', price: 0.50, category: 'tools' },
  { id: 'tablica_pisarska', name: 'Tablica pisarska i kreda', price: 0.50, category: 'tools' },

  // === Medyczne ===
  { id: 'aspiryna', name: 'Aspiryna (opakowanie)', price: 0.25, category: 'medical' },
  { id: 'bandaze', name: 'Bandaże (zestaw)', price: 0.50, category: 'medical' },
  { id: 'torba_lekarska', name: 'Torba lekarska', price: 15, category: 'medical' },
  { id: 'strzykawka', name: 'Strzykawka', price: 1, category: 'medical' },
  { id: 'morfina_dawka', name: 'Morfina (dawka)', price: 1, category: 'medical' },
  { id: 'srodek_znieczulajacy', name: 'Środek znieczulający', price: 2, category: 'medical' },
  { id: 'apteczka_polowa', name: 'Apteczka polowa', price: 5, category: 'medical' },
  { id: 'szyna_unaczyniajaca', name: 'Szyna unieruchamiająca', price: 1, category: 'medical' },
  { id: 'nosze', name: 'Nosze', price: 5, category: 'medical' },
  { id: 'narzedzia_chirurgiczne', name: 'Narzędzia chirurgiczne', price: 30, category: 'medical' },

  // === Rozmaitości ===
  { id: 'papierosy_paczka', name: 'Papierosy (paczka)', price: 0.15, category: 'misc' },
  { id: 'cygara_pudelko', name: 'Cygara (pudełko)', price: 1, category: 'misc' },
  { id: 'tyton_i_fajka', name: 'Tytoń i fajka', price: 1, category: 'misc' },
  { id: 'parasol_v2', name: 'Parasol', price: 3, category: 'misc' },
  { id: 'kompas', name: 'Kompas', price: 3, category: 'misc' },
  { id: 'zegarek_kieszonkowy', name: 'Zegarek kieszonkowy', price: 5, category: 'misc' },
  { id: 'zegarek_na_reke_v2', name: 'Zegarek na rękę', price: 15, category: 'misc' },
  { id: 'maszyna_do_pisania', name: 'Maszyna do pisania', price: 50, category: 'misc' },
  { id: 'notes_i_olowek', name: 'Notes i ołówek', price: 0.25, category: 'misc' },
  { id: 'atrament_i_pioro', name: 'Atrament i pióro', price: 1, category: 'misc' },
  { id: 'ksiazka_powszechna', name: 'Książka (powszechna)', price: 1, category: 'misc' },
  { id: 'ksiazka_specjalistyczna', name: 'Książka (specjalistyczna)', price: 5, category: 'misc' },
  { id: 'gwizdek', name: 'Gwizdek', price: 0.25, category: 'misc' },
  { id: 'laska_spacerowa_v2', name: 'Laska spacerowa', price: 5, category: 'misc' },
  { id: 'noz_scyzoryk', name: 'Nóż / scyzoryk', price: 0.50, category: 'misc' },
  { id: 'torebka_damska', name: 'Torebka damska', price: 3, category: 'misc' },
  { id: 'portfel', name: 'Portfel', price: 1, category: 'misc' },
  { id: 'kajdanki', name: 'Kajdanki', price: 10, category: 'misc' },
  { id: 'koc', name: 'Koc', price: 2, category: 'misc' },
  { id: 'bilet_autobusowy', name: 'Bilet autobusowy', price: 0.10, category: 'misc' },
  { id: 'bilet_kolejowy_krotki', name: 'Bilet kolejowy (krótki)', price: 1, category: 'misc' },
  { id: 'bilet_kolejowy_dlugi', name: 'Bilet kolejowy (długi)', price: 10, category: 'misc' },
  { id: 'posilek_tani', name: 'Posiłek (tani)', price: 0.25, category: 'misc' },
  { id: 'posilek_dobry', name: 'Posiłek (dobry)', price: 1, category: 'misc' },
  { id: 'nocleg_tanszy', name: 'Nocleg (tańszy)', price: 0.50, category: 'misc' },
  { id: 'nocleg_lepszy', name: 'Nocleg (lepszy)', price: 2, category: 'misc' },
  { id: 'nocleg_hotel', name: 'Nocleg (hotel)', price: 5, category: 'misc' },
]
