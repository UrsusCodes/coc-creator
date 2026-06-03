/**
 * Equipment Catalog v2 — Standard equipment (excluding weapons/ammo)
 * Pre-existing entries are 1920s/modern/gaslight; Wild West entries are flagged with era: ['wild_west'].
 */

import type { Era } from '@/types/common'

export interface EquipmentItemV2 {
  id: string
  name: string
  price: number        // in dollars
  category: string
  dailyMaintenance?: number  // for vehicles only
  era?: Era[]                // era whitelist; entries with omitted era are visible everywhere (none after migration)
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
  'explosives',
  'misc',
  'clothing',
  'food',
  'entertainment',
  'livestock',
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
  explosives: 'Materiały wybuchowe',
  misc: 'Rozmaitości',
  clothing: 'Odzież',
  food: 'Prowiant',
  entertainment: 'Rozrywka',
  livestock: 'Dobytek',
}

const PRE_WW_ERAS: Era[] = ['classic_1920s', 'modern', 'gaslight']

export const EQUIPMENT_CATALOG_V2: EquipmentItemV2[] = [
  // === Pojazdy ===
  { id: 'zuzyty_motocykl', name: 'Zużyty motocykl', price: 50, category: 'vehicles', dailyMaintenance: 0.05, era: PRE_WW_ERAS },
  { id: 'motocykl', name: 'Motocykl', price: 120, category: 'vehicles', dailyMaintenance: 0.10, era: PRE_WW_ERAS },
  { id: 'swietny_motocykl', name: 'Świetny motocykl', price: 220, category: 'vehicles', dailyMaintenance: 0.15, era: PRE_WW_ERAS },
  { id: 'zuzyty_samochod', name: 'Zużyty samochód', price: 180, category: 'vehicles', dailyMaintenance: 0.15, era: PRE_WW_ERAS },
  { id: 'przecietne_auto', name: 'Przeciętne auto', price: 450, category: 'vehicles', dailyMaintenance: 0.25, era: PRE_WW_ERAS },
  { id: 'dobre_auto', name: 'Dobre auto', price: 1200, category: 'vehicles', dailyMaintenance: 0.50, era: PRE_WW_ERAS },
  { id: 'luksusowe_auto', name: 'Luksusowe auto', price: 3000, category: 'vehicles', dailyMaintenance: 0.80, era: PRE_WW_ERAS },

  // === Światło ===
  { id: 'swiece_6szt', name: 'Świece (6 szt.)', price: 0.25, category: 'light', era: PRE_WW_ERAS },
  { id: 'swiece_w_latarni', name: 'Świece w latarni', price: 1, category: 'light', era: PRE_WW_ERAS },
  { id: 'flara_6szt', name: 'Flara (6 szt.)', price: 1, category: 'light', era: PRE_WW_ERAS },
  { id: 'lampa_naftowa_mala', name: 'Lampa naftowa (mała)', price: 2, category: 'light', era: PRE_WW_ERAS },
  { id: 'lampa_naftowa_duza', name: 'Lampa naftowa (duża)', price: 5, category: 'light', era: PRE_WW_ERAS },
  { id: 'latarka_mala', name: 'Latarka (mała)', price: 3, category: 'light', era: PRE_WW_ERAS },
  { id: 'latarka_duza', name: 'Latarka (duża)', price: 5, category: 'light', era: PRE_WW_ERAS },
  { id: 'lampa_karbidowa', name: 'Lampa karbidowa', price: 4, category: 'light', era: PRE_WW_ERAS },
  { id: 'pochodnia', name: 'Pochodnia', price: 0.50, category: 'light', era: PRE_WW_ERAS },
  { id: 'zapalki_pudelko', name: 'Zapałki (pudełko)', price: 0.05, category: 'light', era: PRE_WW_ERAS },
  { id: 'zapalniczka', name: 'Zapalniczka', price: 1, category: 'light', era: PRE_WW_ERAS },
  { id: 'reflektor_przenozny', name: 'Reflektor przenośny', price: 15, category: 'light', era: PRE_WW_ERAS },

  // === Optyka ===
  { id: 'monokl', name: 'Monokl', price: 3, category: 'optics', era: PRE_WW_ERAS },
  { id: 'mikroskop_prosty', name: 'Mikroskop (prosty)', price: 15, category: 'optics', era: PRE_WW_ERAS },
  { id: 'mikroskop_laboratoryjny', name: 'Mikroskop laboratoryjny', price: 75, category: 'optics', era: PRE_WW_ERAS },
  { id: 'luneta_mala', name: 'Luneta (mała)', price: 5, category: 'optics', era: PRE_WW_ERAS },
  { id: 'luneta_duza', name: 'Luneta (duża)', price: 15, category: 'optics', era: PRE_WW_ERAS },
  { id: 'lornetka_polowa', name: 'Lornetka polowa', price: 10, category: 'optics', era: PRE_WW_ERAS },
  { id: 'lornetka_teatralna', name: 'Lornetka teatralna', price: 5, category: 'optics', era: PRE_WW_ERAS },
  { id: 'lupa', name: 'Lupa', price: 1, category: 'optics', era: PRE_WW_ERAS },
  { id: 'okulary', name: 'Okulary', price: 3, category: 'optics', era: PRE_WW_ERAS },
  { id: 'okulary_sloneczne', name: 'Okulary słoneczne', price: 5, category: 'optics', era: PRE_WW_ERAS },

  // === Fotografia ===
  { id: 'blona_fotograficzna', name: 'Błona fotograficzna (rolka)', price: 0.50, category: 'photo', era: PRE_WW_ERAS },
  { id: 'film_kinowy_rolka', name: 'Film kinowy (rolka)', price: 5, category: 'photo', era: PRE_WW_ERAS },
  { id: 'aparat_prosty', name: 'Aparat foto (prosty)', price: 5, category: 'photo', era: PRE_WW_ERAS },
  { id: 'aparat_dobry', name: 'Aparat foto (dobry)', price: 25, category: 'photo', era: PRE_WW_ERAS },
  { id: 'aparat_profesjonalny', name: 'Aparat foto (prof.)', price: 75, category: 'photo', era: PRE_WW_ERAS },
  { id: 'dyktafon', name: 'Dyktafon', price: 50, category: 'photo', era: PRE_WW_ERAS },
  { id: 'kamera_filmowa', name: 'Kamera filmowa', price: 200, category: 'photo', era: PRE_WW_ERAS },
  { id: 'spadochron', name: 'Spadochron', price: 100, category: 'photo', era: PRE_WW_ERAS },

  // === Komunikacja ===
  { id: 'gazeta', name: 'Gazeta', price: 0.05, category: 'communication', era: PRE_WW_ERAS },
  { id: 'telefon_aparat', name: 'Aparat telefoniczny', price: 15, category: 'communication', era: PRE_WW_ERAS },
  { id: 'radio_odbiornik', name: 'Radio (odbiornik)', price: 25, category: 'communication', era: PRE_WW_ERAS },
  { id: 'radio_nadawczo_odbiorcze', name: 'Radio nadawczo-odbiorcze', price: 75, category: 'communication', era: PRE_WW_ERAS },

  // === Podróż ===
  { id: 'buklak', name: 'Bukłak', price: 1, category: 'travel', era: PRE_WW_ERAS },
  { id: 'termos', name: 'Termos', price: 2, category: 'travel', era: PRE_WW_ERAS },
  { id: 'namiot_1os', name: 'Namiot (1-osobowy)', price: 5, category: 'travel', era: PRE_WW_ERAS },
  { id: 'namiot_4os', name: 'Namiot (4-osobowy)', price: 15, category: 'travel', era: PRE_WW_ERAS },
  { id: 'namiot_8os', name: 'Namiot (8-osobowy)', price: 30, category: 'travel', era: PRE_WW_ERAS },
  { id: 'lozko_polowe', name: 'Łóżko polowe', price: 3, category: 'travel', era: PRE_WW_ERAS },
  { id: 'spiwor', name: 'Śpiwór', price: 5, category: 'travel', era: PRE_WW_ERAS },
  { id: 'canoe', name: 'Canoe', price: 25, category: 'travel', era: PRE_WW_ERAS },
  { id: 'walizka', name: 'Walizka', price: 3, category: 'travel', era: PRE_WW_ERAS },
  { id: 'kufer_podruzny', name: 'Kufer podróżny', price: 10, category: 'travel', era: PRE_WW_ERAS },
  { id: 'plecak', name: 'Plecak', price: 2, category: 'travel', era: PRE_WW_ERAS },
  { id: 'torba_podrozna', name: 'Torba podróżna', price: 3, category: 'travel', era: PRE_WW_ERAS },
  { id: 'mapa_regionalna', name: 'Mapa regionalna', price: 0.50, category: 'travel', era: PRE_WW_ERAS },

  // === Narzędzia ===
  { id: 'lopata', name: 'Łopata', price: 1, category: 'tools', era: PRE_WW_ERAS },
  { id: 'lom', name: 'Łom', price: 1, category: 'tools', era: PRE_WW_ERAS },
  { id: 'lina_15m', name: 'Lina (15 m)', price: 1, category: 'tools', era: PRE_WW_ERAS },
  { id: 'lina_30m', name: 'Lina (30 m)', price: 2, category: 'tools', era: PRE_WW_ERAS },
  { id: 'wiertarka_reczna', name: 'Wiertarka ręczna', price: 3, category: 'tools', era: PRE_WW_ERAS },
  { id: 'pila_reczna', name: 'Piła ręczna', price: 2, category: 'tools', era: PRE_WW_ERAS },
  { id: 'mlot', name: 'Młot', price: 1, category: 'tools', era: PRE_WW_ERAS },
  { id: 'gwozdzie_pudelko', name: 'Gwoździe (pudełko)', price: 0.25, category: 'tools', era: PRE_WW_ERAS },
  { id: 'sruby_pudelko', name: 'Śruby (pudełko)', price: 0.50, category: 'tools', era: PRE_WW_ERAS },
  { id: 'lancuch_3m', name: 'Łańcuch (3 m)', price: 2, category: 'tools', era: PRE_WW_ERAS },
  { id: 'klodka', name: 'Kłódka', price: 1, category: 'tools', era: PRE_WW_ERAS },
  { id: 'wytrychy', name: 'Wytrychy', price: 10, category: 'tools', era: PRE_WW_ERAS },
  { id: 'siekiera', name: 'Siekiera', price: 2, category: 'tools', era: PRE_WW_ERAS },
  { id: 'kolki_drewniane', name: 'Kołki drewniane (6 szt.)', price: 0.50, category: 'tools', era: PRE_WW_ERAS },
  { id: 'tablica_pisarska', name: 'Tablica pisarska i kreda', price: 0.50, category: 'tools', era: PRE_WW_ERAS },

  // === Medyczne ===
  { id: 'aspiryna', name: 'Aspiryna (opakowanie)', price: 0.25, category: 'medical', era: PRE_WW_ERAS },
  { id: 'bandaze', name: 'Bandaże (zestaw)', price: 0.50, category: 'medical', era: PRE_WW_ERAS },
  { id: 'torba_lekarska', name: 'Torba lekarska', price: 15, category: 'medical', era: PRE_WW_ERAS },
  { id: 'strzykawka', name: 'Strzykawka', price: 1, category: 'medical', era: PRE_WW_ERAS },
  { id: 'morfina_dawka', name: 'Morfina (dawka)', price: 1, category: 'medical', era: PRE_WW_ERAS },
  { id: 'srodek_znieczulajacy', name: 'Środek znieczulający', price: 2, category: 'medical', era: PRE_WW_ERAS },
  { id: 'apteczka_polowa', name: 'Apteczka polowa', price: 5, category: 'medical', era: PRE_WW_ERAS },
  { id: 'szyna_unaczyniajaca', name: 'Szyna unieruchamiająca', price: 1, category: 'medical', era: PRE_WW_ERAS },
  { id: 'nosze', name: 'Nosze', price: 5, category: 'medical', era: PRE_WW_ERAS },
  { id: 'narzedzia_chirurgiczne', name: 'Narzędzia chirurgiczne', price: 30, category: 'medical', era: PRE_WW_ERAS },

  // === Materiały wybuchowe ===
  { id: 'dynamit_laseczka', name: 'Dynamit (laseczka)', price: 10, category: 'explosives', era: PRE_WW_ERAS },
  { id: 'lont_metr', name: 'Lont (metr)', price: 0.50, category: 'explosives', era: PRE_WW_ERAS },
  { id: 'zapalnik', name: 'Zapalnik', price: 2, category: 'explosives', era: PRE_WW_ERAS },
  { id: 'detonator_elektryczny', name: 'Detonator elektryczny', price: 15, category: 'explosives', era: PRE_WW_ERAS },

  // === Rozmaitości ===
  { id: 'papierosy_paczka', name: 'Papierosy (paczka)', price: 0.15, category: 'misc', era: PRE_WW_ERAS },
  { id: 'cygara_pudelko', name: 'Cygara (pudełko)', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'tyton_i_fajka', name: 'Tytoń i fajka', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'parasol_v2', name: 'Parasol', price: 3, category: 'misc', era: PRE_WW_ERAS },
  { id: 'kompas', name: 'Kompas', price: 3, category: 'misc', era: PRE_WW_ERAS },
  { id: 'zegarek_kieszonkowy', name: 'Zegarek kieszonkowy', price: 5, category: 'misc', era: PRE_WW_ERAS },
  { id: 'zegarek_na_reke_v2', name: 'Zegarek na rękę', price: 15, category: 'misc', era: PRE_WW_ERAS },
  { id: 'maszyna_do_pisania', name: 'Maszyna do pisania', price: 50, category: 'misc', era: PRE_WW_ERAS },
  { id: 'notes_i_olowek', name: 'Notes i ołówek', price: 0.25, category: 'misc', era: PRE_WW_ERAS },
  { id: 'atrament_i_pioro', name: 'Atrament i pióro', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'ksiazka_powszechna', name: 'Książka (powszechna)', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'ksiazka_specjalistyczna', name: 'Książka (specjalistyczna)', price: 5, category: 'misc', era: PRE_WW_ERAS },
  { id: 'gwizdek', name: 'Gwizdek', price: 0.25, category: 'misc', era: PRE_WW_ERAS },
  { id: 'laska_spacerowa_v2', name: 'Laska spacerowa', price: 5, category: 'misc', era: PRE_WW_ERAS },
  { id: 'noz_scyzoryk', name: 'Nóż / scyzoryk', price: 0.50, category: 'misc', era: PRE_WW_ERAS },
  { id: 'torebka_damska', name: 'Torebka damska', price: 3, category: 'misc', era: PRE_WW_ERAS },
  { id: 'portfel', name: 'Portfel', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'kajdanki', name: 'Kajdanki', price: 10, category: 'misc', era: PRE_WW_ERAS },
  { id: 'koc', name: 'Koc', price: 2, category: 'misc', era: PRE_WW_ERAS },
  { id: 'bilet_autobusowy', name: 'Bilet autobusowy', price: 0.10, category: 'misc', era: PRE_WW_ERAS },
  { id: 'bilet_kolejowy_krotki', name: 'Bilet kolejowy (krótki)', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'bilet_kolejowy_dlugi', name: 'Bilet kolejowy (długi)', price: 10, category: 'misc', era: PRE_WW_ERAS },
  { id: 'posilek_tani', name: 'Posiłek (tani)', price: 0.25, category: 'misc', era: PRE_WW_ERAS },
  { id: 'posilek_dobry', name: 'Posiłek (dobry)', price: 1, category: 'misc', era: PRE_WW_ERAS },
  { id: 'nocleg_tanszy', name: 'Nocleg (tańszy)', price: 0.50, category: 'misc', era: PRE_WW_ERAS },
  { id: 'nocleg_lepszy', name: 'Nocleg (lepszy)', price: 2, category: 'misc', era: PRE_WW_ERAS },
  { id: 'nocleg_hotel', name: 'Nocleg (hotel)', price: 5, category: 'misc', era: PRE_WW_ERAS },

  // ===========================================================
  // === Wild West (era: ['wild_west']) ========================
  // ===========================================================

  // === Odzież ===
  { id: 'ww_pas', name: 'Pas', price: 0.75, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_buty_slabe', name: 'Buty (słabe)', price: 3, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_buty_przecietne', name: 'Buty (przeciętne)', price: 10, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_buty_bardzo_dobre', name: 'Buty (b. dobre)', price: 20, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_buty_kowbojskie_przecietne', name: 'Buty kowbojskie szyte na miarę (przeciętne)', price: 15, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_buty_kowbojskie_bardzo_dobre', name: 'Buty kowbojskie szyte na miarę (b. dobre)', price: 25, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_plaszcz_bawoli', name: 'Płaszcz z bawolej skóry', price: 10, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_pas_na_naboje', name: 'Pas na naboje', price: 1, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_plaszcz_welniany', name: 'Płaszcz wełniany', price: 8, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_kamizelka_materialowa', name: 'Kamizelka materiałowa', price: 1, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_sukienka_przecietna', name: 'Sukienka (przeciętna)', price: 2, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_sukienka_bardzo_dobra', name: 'Sukienka (b. dobra)', price: 10, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_plaszcz_futrzany', name: 'Płaszcz futrzany', price: 15, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_kapelusz_slaby', name: 'Kapelusz (słaby)', price: 2, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_kapelusz_przecietny', name: 'Kapelusz (przeciętny)', price: 7, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_kapelusz_bardzo_dobry', name: 'Kapelusz (b. dobry)', price: 15, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_kamizelka_skorzana', name: 'Kamizelka skórzana', price: 3, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_lniany_duster', name: 'Lniany duster', price: 2, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_koszula_przecietna', name: 'Koszula (przeciętna)', price: 0.50, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_koszula_bardzo_dobra', name: 'Koszula (b. dobra)', price: 2, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_stetson_boss', name: 'Stetson "Boss"', price: 5, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_garnitur_przecietny', name: 'Garnitur (przeciętny)', price: 12, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_garnitur_bardzo_dobry', name: 'Garnitur (b. dobry)', price: 25, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_szelki', name: 'Szelki', price: 0.50, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_ostrogi_slabe', name: 'Ostrogi (słabe)', price: 0.15, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_ostrogi_przecietne', name: 'Ostrogi (przeciętne)', price: 2, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_ostrogi_bardzo_dobre', name: 'Ostrogi (b. dobre)', price: 10, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_eleganckie_buty', name: 'Eleganckie buty', price: 2.50, category: 'clothing', era: ['wild_west'] },
  { id: 'ww_spodnie', name: 'Spodnie', price: 1.50, category: 'clothing', era: ['wild_west'] },

  // === Rozrywka ===
  { id: 'ww_banjo', name: 'Banjo', price: 7, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_ksiazka_oprawna', name: 'Książka oprawna', price: 0.50, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_kosci_para', name: 'Kości (para)', price: 0.10, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_kosci_falszowane', name: 'Kości fałszowane', price: 5, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_gitara', name: 'Gitara', price: 5, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_harmonijka', name: 'Harmonijka', price: 0.25, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_powiesc_broszurowa', name: 'Powieść broszurowa', price: 0.10, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_karty_do_gry', name: 'Karty do gry', price: 0.25, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_karty_znaczone', name: 'Karty znaczone', price: 1.25, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_skrzypce', name: 'Skrzypce', price: 9, category: 'entertainment', era: ['wild_west'] },
  { id: 'ww_butelka_whisky', name: 'Butelka whisky', price: 2, category: 'entertainment', era: ['wild_west'] },

  // === Medyczne (WW) ===
  { id: 'ww_torba_lekarska', name: 'Torba lekarska z narzędziami', price: 25, category: 'medical', era: ['wild_west'] },
  { id: 'ww_laudanum', name: 'Laudanum (4 uncje)', price: 0.35, category: 'medical', era: ['wild_west'] },

  // === Podróż (WW) ===
  { id: 'ww_rolka_poscielowa', name: 'Rolka pościelowa', price: 4, category: 'travel', era: ['wild_west'] },
  { id: 'ww_lornetka_przecietna', name: 'Lornetka (przeciętna)', price: 10, category: 'travel', era: ['wild_west'] },
  { id: 'ww_lornetka_bardzo_dobra', name: 'Lornetka (b. dobra)', price: 25, category: 'travel', era: ['wild_west'] },
  { id: 'ww_koc', name: 'Koc', price: 3, category: 'travel', era: ['wild_west'] },
  { id: 'ww_pudelko_zapalek', name: 'Pudełko zapałek', price: 0.10, category: 'travel', era: ['wild_west'] },
  { id: 'ww_manierka', name: 'Manierka', price: 0.50, category: 'travel', era: ['wild_west'] },
  { id: 'ww_dzbanek_na_kawe', name: 'Dzbanek na kawę', price: 1, category: 'travel', era: ['wild_west'] },
  { id: 'ww_kompas', name: 'Kompas', price: 2, category: 'travel', era: ['wild_west'] },
  { id: 'ww_zestaw_toaletowy', name: 'Zestaw toaletowy dżentelmena', price: 1, category: 'travel', era: ['wild_west'] },
  { id: 'ww_kociolek_mosiezny', name: 'Kociołek mosiężny (4 galony)', price: 3, category: 'travel', era: ['wild_west'] },
  { id: 'ww_lampa_naftowa', name: 'Lampa naftowa', price: 1.50, category: 'travel', era: ['wild_west'] },
  { id: 'ww_parasolka_jedwabna', name: 'Parasolka jedwabna', price: 1, category: 'travel', era: ['wild_west'] },
  { id: 'ww_namiot_1', name: 'Namiot jednoosobowy', price: 5, category: 'travel', era: ['wild_west'] },
  { id: 'ww_namiot_3', name: 'Namiot trzyosobowy', price: 9, category: 'travel', era: ['wild_west'] },
  { id: 'ww_racje_tygodniowe', name: 'Racje na tydzień', price: 1.50, category: 'travel', era: ['wild_west'] },
  { id: 'ww_wnyki_wilki', name: 'Wnyki na wilki', price: 2, category: 'travel', era: ['wild_west'] },
  { id: 'ww_wnyki_niedzwiedz', name: 'Wnyki na niedźwiedzia', price: 10, category: 'travel', era: ['wild_west'] },
  { id: 'ww_kufer_maly_przecietny', name: 'Kufer podróżny (mały) — przeciętny', price: 4, category: 'travel', era: ['wild_west'] },
  { id: 'ww_kufer_maly_bardzo_dobry', name: 'Kufer podróżny (mały) — b. dobry', price: 10, category: 'travel', era: ['wild_west'] },
  { id: 'ww_kufer_duzy_przecietny', name: 'Kufer podróżny (duży) — przeciętny', price: 10, category: 'travel', era: ['wild_west'] },
  { id: 'ww_kufer_duzy_bardzo_dobry', name: 'Kufer podróżny (duży) — b. dobry', price: 25, category: 'travel', era: ['wild_west'] },

  // === Prowiant ===
  { id: 'ww_bekon', name: 'Bekon (10 funtów)', price: 0.60, category: 'food', era: ['wild_west'] },
  { id: 'ww_kawa', name: 'Kawa (2 funty)', price: 0.50, category: 'food', era: ['wild_west'] },
  { id: 'ww_maka', name: 'Worek mąki (50 funtów)', price: 4, category: 'food', era: ['wild_west'] },
  { id: 'ww_cukier', name: 'Cukier (1 funt)', price: 0.10, category: 'food', era: ['wild_west'] },

  // === Narzędzia (WW) ===
  { id: 'ww_siekiera_tool', name: 'Siekiera (narzędzie)', price: 1, category: 'tools', era: ['wild_west'] },
  { id: 'ww_narzedzia_kowalskie', name: 'Narzędzia kowalskie', price: 15, category: 'tools', era: ['wild_west'] },
  { id: 'ww_splonki', name: 'Spłonki górnicze (tuzin)', price: 1, category: 'tools', era: ['wild_west'] },
  { id: 'ww_dynamit_tool', name: 'Laska dynamitu (narzędzie)', price: 0.25, category: 'tools', era: ['wild_west'] },
  { id: 'ww_detonator', name: 'Detonator elektryczny', price: 5, category: 'tools', era: ['wild_west'] },
  { id: 'ww_lont_jard', name: 'Lont (jard)', price: 0.05, category: 'tools', era: ['wild_west'] },
  { id: 'ww_mlotek', name: 'Młotek', price: 0.50, category: 'tools', era: ['wild_west'] },
  { id: 'ww_toporek', name: 'Toporek', price: 0.75, category: 'tools', era: ['wild_west'] },
  { id: 'ww_nafta', name: 'Nafta (galon)', price: 3, category: 'tools', era: ['wild_west'] },
  { id: 'ww_latarnia', name: 'Latarnia', price: 0.80, category: 'tools', era: ['wild_west'] },
  { id: 'ww_nitrogliceryna', name: 'Nitrogliceryna (uncja)', price: 0.50, category: 'tools', era: ['wild_west'] },
  { id: 'ww_kilof', name: 'Kilof', price: 0.75, category: 'tools', era: ['wild_west'] },
  { id: 'ww_scyzoryk', name: 'Scyzoryk', price: 0.50, category: 'tools', era: ['wild_west'] },
  { id: 'ww_lina_jard', name: 'Lina (jard)', price: 0.05, category: 'tools', era: ['wild_west'] },
  { id: 'ww_luneta', name: 'Luneta', price: 10, category: 'tools', era: ['wild_west'] },
  { id: 'ww_lopata', name: 'Łopata', price: 0.50, category: 'tools', era: ['wild_west'] },

  // === Transport (WW) ===
  { id: 'ww_osiolek', name: 'Osiołek', price: 30, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_kon_pociagowy', name: 'Koń pociągowy', price: 60, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_kon_wierzchowy_slaby', name: 'Koń wierzchowy (słaby)', price: 30, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_kon_wierzchowy_przecietny', name: 'Koń wierzchowy (przeciętny)', price: 100, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_kon_wierzchowy_bardzo_dobry', name: 'Koń wierzchowy (b. dobry)', price: 200, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_mul', name: 'Muł', price: 80, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_wol', name: 'Wół', price: 75, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_kucyk', name: 'Kucyk', price: 50, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_juki', name: 'Juki', price: 3, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_siodlo_przecietne', name: 'Siodło/uzda/derka (przeciętne)', price: 30, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_siodlo_bardzo_dobre', name: 'Siodło/uzda/derka (b. dobre)', price: 70, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_bryczka_przecietna', name: 'Bryczka 2-osobowa (przeciętna)', price: 30, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_bryczka_bardzo_dobra', name: 'Bryczka 2-osobowa (b. dobra)', price: 60, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_surrey_slaby', name: 'Surrey 4-osobowy (słaby)', price: 50, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_surrey_przecietny', name: 'Surrey 4-osobowy (przeciętny)', price: 100, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_surrey_bardzo_dobry', name: 'Surrey 4-osobowy (b. dobry)', price: 175, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_uprzaz_pojedyncza', name: 'Uprząż pojedyncza', price: 10, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_uprzaz_podwojna', name: 'Uprząż podwójna', price: 25, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_wagon_ciezki', name: 'Ciężki wóz', price: 40, category: 'vehicles', era: ['wild_west'] },
  { id: 'ww_wagon_lekki', name: 'Lekki wóz', price: 35, category: 'vehicles', era: ['wild_west'] },

  // === Różne (WW) ===
  { id: 'ww_okulary', name: 'Okulary', price: 2, category: 'misc', era: ['wild_west'] },
  { id: 'ww_kabura_przecietna', name: 'Kabura (przeciętna)', price: 1, category: 'misc', era: ['wild_west'] },
  { id: 'ww_kabura_bardzo_dobra', name: 'Kabura (b. dobra)', price: 5, category: 'misc', era: ['wild_west'] },
  { id: 'ww_kasetka', name: 'Kasetka na pieniądze', price: 1.35, category: 'misc', era: ['wild_west'] },
  { id: 'ww_zegarek_przecietny', name: 'Zegarek kieszonkowy (przeciętny)', price: 1, category: 'misc', era: ['wild_west'] },
  { id: 'ww_zegarek_bardzo_dobry', name: 'Zegarek kieszonkowy (b. dobry)', price: 10, category: 'misc', era: ['wild_west'] },
  { id: 'ww_maszyna_do_pisania', name: 'Maszyna do pisania', price: 34, category: 'misc', era: ['wild_west'] },

  // === Dobytek ===
  { id: 'ww_owca', name: 'Owca', price: 5, category: 'livestock', era: ['wild_west'] },
  { id: 'ww_bydlo', name: 'Bydło (na targu)', price: 30, category: 'livestock', era: ['wild_west'] },
  { id: 'ww_ciele', name: 'Cielę', price: 3, category: 'livestock', era: ['wild_west'] },
  { id: 'ww_byczek', name: 'Byczek', price: 10, category: 'livestock', era: ['wild_west'] },
]
