/**
 * Weapons & Ammo Catalog v2 — Full weapon list with numeric prices
 * Pre-existing entries are 1920s/modern/gaslight; Wild West entries are flagged with era: ['wild_west'].
 */

import type { Era } from '@/types/common'

export interface WeaponV2 {
  id: string
  name: string
  price: number
  damage: string
  range: string
  ammo: number | null
  malfunction?: number
  category: 'melee' | 'handgun' | 'rifle' | 'shotgun'
  skillId: string
  era?: Era[]      // era whitelist; entries with omitted era are visible everywhere (none after migration)
  rare?: boolean   // true if availability is R/VR in source material
}

export interface AmmoV2 {
  id: string
  name: string
  price: number
  quantity: number
}

const PRE_WW_ERAS: Era[] = ['classic_1920s', 'modern', 'gaslight']
const WW_ERAS: Era[] = ['wild_west']

export const WEAPONS_CATALOG_V2: WeaponV2[] = [
  // === Broń biała (melee) ===
  { id: 'kastet', name: 'Kastet', price: 2, damage: '1K3+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'szpicruta', name: 'Szpicruta', price: 3, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'bykowiec', name: 'Bykowiec', price: 2, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'brzytwa', name: 'Brzytwa', price: 0.50, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'noz_kieszonkowy', name: 'Nóż kieszonkowy', price: 0.50, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'noz_bojowy', name: 'Nóż bojowy / sztylet', price: 1, damage: '1K4+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'noz_mysliwski', name: 'Nóż myśliwski', price: 3, damage: '1K4+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'palka', name: 'Pałka / kij', price: 1, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'palka_policyjna', name: 'Pałka policyjna', price: 3, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: PRE_WW_ERAS },
  { id: 'topor_maly', name: 'Mały topór', price: 3, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'topor_duzy', name: 'Duży topór', price: 5, damage: '1K8+2+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'siekiera_bojowa', name: 'Siekiera bojowa', price: 10, damage: '1K8+2+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'miecz_szeroki', name: 'Miecz szeroki', price: 15, damage: '1K8+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'miecz_rapier', name: 'Rapier', price: 20, damage: '1K6+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'szabla', name: 'Szabla', price: 15, damage: '1K8+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'wlocznia', name: 'Włócznia', price: 5, damage: '1K8+1+MO', range: 'dotyk/rzut', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: PRE_WW_ERAS },
  { id: 'luk', name: 'Łuk', price: 10, damage: '1K6+połowa MO', range: '30 m', ammo: null, category: 'melee', skillId: 'walka_wrecz:luk', era: PRE_WW_ERAS },
  { id: 'kusza', name: 'Kusza', price: 25, damage: '1K8+2', range: '50 m', ammo: null, category: 'melee', skillId: 'walka_wrecz:kusza', era: PRE_WW_ERAS },

  // === Pistolety i rewolwery (handgun) ===
  { id: 'derringer_25', name: '.25 Derringer', price: 8, damage: '1K6', range: '3 m', ammo: 2, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'derringer_41', name: '.41 Derringer', price: 10, damage: '1K8', range: '5 m', ammo: 2, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'colt_pocket_32', name: '.32 Colt Pocket', price: 15, damage: '1K8', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'sw_32', name: '.32 Smith & Wesson', price: 15, damage: '1K8', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'colt_police_38', name: '.38 Colt Police', price: 20, damage: '1K10', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'sw_38', name: '.38 Smith & Wesson', price: 20, damage: '1K10', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'colt_45_auto', name: '.45 Colt M1911', price: 30, damage: '1K10+2', range: '15 m', ammo: 7, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'sw_44', name: '.44 Smith & Wesson', price: 25, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'colt_45_revolver', name: '.45 Colt Revolver', price: 25, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'webley_455', name: '.455 Webley', price: 25, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'mauser_c96', name: '7.63 Mauser C96', price: 30, damage: '1K10', range: '20 m', ammo: 10, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'luger_p08', name: '9mm Luger P08', price: 30, damage: '1K10', range: '20 m', ammo: 8, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'browning_auto_25', name: '.25 Browning Auto', price: 12, damage: '1K6', range: '10 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },
  { id: 'browning_auto_32', name: '.32 Browning Auto', price: 18, damage: '1K8', range: '15 m', ammo: 8, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: PRE_WW_ERAS },

  // === Karabiny (rifle) ===
  { id: 'karabin_22', name: '.22 Karabin sportowy', price: 15, damage: '1K6+1', range: '30 m', ammo: 6, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'karabin_30_30', name: '.30-30 Karabin myśliwski', price: 35, damage: '2K6+1', range: '110 m', ammo: 6, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'karabin_30_06', name: '.30-06 Springfield', price: 50, damage: '2K6+4', range: '150 m', ammo: 5, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'lee_enfield', name: '.303 Lee-Enfield', price: 45, damage: '2K6+4', range: '150 m', ammo: 10, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'mauser_gew98', name: '7.92 Mauser Gew98', price: 45, damage: '2K6+4', range: '150 m', ammo: 5, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'karabin_na_slonie', name: 'Karabin na słonie', price: 150, damage: '3K6+4', range: '100 m', ammo: 2, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },

  // === Strzelby (shotgun) ===
  { id: 'remington_dwururka', name: 'Remington dwururka', price: 30, damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 2, malfunction: 100, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'winchester_lever', name: 'Winchester lever', price: 40, damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 5, malfunction: 100, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },
  { id: 'winchester_pump', name: 'Winchester pump', price: 45, damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 5, malfunction: 100, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: PRE_WW_ERAS },

  // ════════════════════════════════════════════════════════════════════
  // Wild West weapons (era: ['wild_west']) — Down Darker Trails pp.33–37
  // ════════════════════════════════════════════════════════════════════

  // === Rewolwery (handgun) ===
  { id: 'ww_colt_pocket_31', name: '.31 Colt Pocket', price: 9, damage: '1K8', range: '10 m', ammo: 5, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_colt_dragoon_44', name: '.44 Colt Dragoon', price: 6, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_lemat_42', name: '.42/.20 LeMat Pistol', price: 17, damage: '1K10+1', range: '15 m', ammo: 9, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: true },
  { id: 'ww_sw_model1_22', name: '.22 S&W Model 1', price: 6, damage: '1K6', range: '15 m', ammo: 7, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_colt_army_44', name: '.44 Colt Army', price: 14, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_colt_navy_36', name: '.36 Colt Navy', price: 6, damage: '1K8', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_colt_police_36', name: '.36 Colt Police', price: 10, damage: '1K8', range: '15 m', ammo: 5, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_sw_model2_32', name: '.32 S&W Model 2', price: 10, damage: '1K6+1', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_colt_peacemaker_45', name: '.45 Colt Peacemaker', price: 10, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_remington_44_40', name: '.44-40 Remington', price: 15, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_sw_schofield_45', name: '.45 S&W Schofield', price: 13, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },

  // === Broń ukryta / jednostrzałowa (handgun, except Rifle Cane) ===
  { id: 'ww_derringer_44', name: '.44 Derringer', price: 2, damage: '1K10+2', range: '3 m', ammo: 1, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: true },
  { id: 'ww_colt_1shot_41', name: '.41 Colt 1-strzał', price: 3, damage: '1K10+1', range: '3 m', ammo: 1, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_remington_2shot_41', name: '.41 Remington 2-strzały', price: 5, damage: '1K10+1', range: '3 m', ammo: 2, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: false },
  { id: 'ww_colt_cloverleaf_41', name: '.41 Colt Cloverleaf', price: 9, damage: '1K10+1', range: '3 m', ammo: 4, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka', era: WW_ERAS, rare: true },
  { id: 'ww_remington_rifle_cane', name: '.32/.22 Laska-strzelba Remington', price: 10, damage: '1K8', range: '15 m', ammo: 1, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },

  // === Karabiny (rifle) ===
  { id: 'ww_hawken_50', name: 'Karabin .50 Hawken Plains', price: 5, damage: '2K6+4', range: '60 m', ammo: 1, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_sharps_52', name: 'Karabin .52 Sharps', price: 12, damage: '2K6+2', range: '80 m', ammo: 1, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_sharps_carbine_52', name: 'Karabinek .52 Sharps', price: 11, damage: '2K6+2', range: '50 m', ammo: 1, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_springfield_58', name: 'Karabin .58 Springfield', price: 10, damage: '1K10+4', range: '60 m', ammo: 1, malfunction: 95, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_henry_44', name: 'Karabin .44 Henry', price: 17, damage: '2K6+1', range: '80 m', ammo: 16, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_spencer_carbine_56', name: 'Karabinek .56 Spencer', price: 18, damage: '2K6+3', range: '50 m', ammo: 8, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_springfield_trapdoor_50_70', name: 'Karabin .50-70 Springfield Trapdoor', price: 12, damage: '2K6+4', range: '90 m', ammo: 1, malfunction: 99, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_springfield_trapdoor_45_70', name: 'Karabin .45-70 Springfield Trapdoor', price: 12, damage: '2K6+2', range: '100 m', ammo: 1, malfunction: 99, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_winchester_73_44_40', name: "Karabin/karabinek .44-40 Winchester '73", price: 20, damage: '2K6+1', range: '80 m', ammo: 18, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_sharps_big_50', name: 'Sharps "Big .50"', price: 17, damage: '3K6', range: '100 m', ammo: 1, malfunction: 99, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_winchester_76_45', name: "Karabin/karabinek .45 Winchester '76", price: 22, damage: '2K6+3', range: '80 m', ammo: 14, malfunction: 98, category: 'rifle', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },

  // === Strzelby (shotgun) ===
  { id: 'ww_shotgun_10', name: 'Strzelba 10-kalibrowa', price: 25, damage: '4K6+2/2K6+1/1K4', range: '10/20/50 m', ammo: 2, malfunction: 99, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_shotgun_12', name: 'Strzelba 12-kalibrowa', price: 30, damage: '4K6/2K6/1K6', range: '10/20/50 m', ammo: 2, malfunction: 99, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_shotgun_16', name: 'Strzelba 16-kalibrowa', price: 35, damage: '2K6+2/1K6+1/1K4', range: '10/20/50 m', ammo: 2, malfunction: 99, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },
  { id: 'ww_shotgun_20', name: 'Strzelba 20-kalibrowa', price: 40, damage: '2K6/1K6/1K3', range: '10/20/50 m', ammo: 2, malfunction: 99, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba', era: WW_ERAS, rare: false },

  // === Broń ciężka i materiały wybuchowe ===
  { id: 'ww_gatling_58', name: 'Karabin maszynowy Gatling .58', price: 120, damage: '2K6+4', range: '100 m', ammo: 200, malfunction: 95, category: 'rifle', skillId: 'bron_palna:bron_ciezka', era: WW_ERAS, rare: true },
  { id: 'ww_dynamite_stick', name: 'Laska dynamitu', price: 0.25, damage: '4K10 / 3 jardy', range: 'STR stóp', ammo: 1, malfunction: 98, category: 'melee', skillId: 'sztuka_rzemioslo:Materiały Wybuchowe', era: WW_ERAS, rare: true },
  { id: 'ww_incendiary', name: 'Bomba zapalająca', price: 1, damage: '2K6 + spalenie', range: 'STR stóp', ammo: 1, malfunction: 95, category: 'melee', skillId: 'rzucanie', era: WW_ERAS, rare: false },

  // === Broń biała / sieczna (melee) ===
  { id: 'ww_arkansas_toothpick', name: 'Wykałaczka z Arkansas', price: 2, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: WW_ERAS, rare: false },
  { id: 'ww_siekiera', name: 'Siekiera', price: 3, damage: '1K8+2+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: WW_ERAS, rare: false },
  { id: 'ww_bow_arrows', name: 'Łuk ze strzałami', price: 5, damage: '1K6+½MO', range: '30 m', ammo: null, malfunction: 97, category: 'melee', skillId: 'bron_palna:luk_kusza', era: WW_ERAS, rare: false },
  { id: 'ww_bowie_knife', name: 'Nóż Bowie', price: 2, damage: '1K4+2+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: WW_ERAS, rare: false },
  { id: 'ww_burning_torch', name: 'Płonąca pochodnia', price: 0.05, damage: '1K6 + spalenie', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: WW_ERAS, rare: false },
  { id: 'ww_cavalry_saber', name: 'Szabla kawaleryjska', price: 5, damage: '1K8+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: WW_ERAS, rare: false },
  { id: 'ww_club_large', name: 'Pałka duża', price: 0.02, damage: '1K8+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: WW_ERAS, rare: false },
  { id: 'ww_lasso', name: 'Lasso', price: 1.50, damage: 'wiązanie', range: '5 m', ammo: null, malfunction: 100, category: 'melee', skillId: 'wladanie_lina', era: WW_ERAS, rare: false },
  { id: 'ww_spear_bayonet', name: 'Włócznia / bagnet', price: 2, damage: '1K8+1+MO', range: 'dotyk lub STR jardów', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra', era: WW_ERAS, rare: true },
  { id: 'ww_tomahawk', name: 'Tomahawk', price: 2, damage: '1K6+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka', era: WW_ERAS, rare: false },
  { id: 'ww_whip', name: 'Bicz', price: 5, damage: '1K3+½MO lub wiązanie', range: '10 m', ammo: null, malfunction: 100, category: 'melee', skillId: 'walka_wrecz:bicz', era: WW_ERAS, rare: false },
]

export const AMMO_CATALOG: AmmoV2[] = [
  { id: 'ammo_22', name: 'Amunicja .22', price: 0.50, quantity: 50 },
  { id: 'ammo_25', name: 'Amunicja .25', price: 1, quantity: 50 },
  { id: 'ammo_32', name: 'Amunicja .32', price: 1.50, quantity: 50 },
  { id: 'ammo_38', name: 'Amunicja .38', price: 2, quantity: 50 },
  { id: 'ammo_41', name: 'Amunicja .41', price: 2, quantity: 50 },
  { id: 'ammo_44', name: 'Amunicja .44', price: 2.50, quantity: 50 },
  { id: 'ammo_45', name: 'Amunicja .45', price: 2.50, quantity: 50 },
  { id: 'ammo_30_30', name: 'Amunicja .30-30', price: 3, quantity: 20 },
  { id: 'ammo_30_06', name: 'Amunicja .30-06', price: 3.50, quantity: 20 },
  { id: 'ammo_303', name: 'Amunicja .303 British', price: 3.50, quantity: 20 },
  { id: 'ammo_792', name: 'Amunicja 7.92 Mauser', price: 3.50, quantity: 20 },
  { id: 'ammo_763', name: 'Amunicja 7.63 Mauser', price: 3, quantity: 50 },
  { id: 'ammo_9mm', name: 'Amunicja 9mm Parabellum', price: 3, quantity: 50 },
  { id: 'ammo_455', name: 'Amunicja .455 Webley', price: 3, quantity: 50 },
  { id: 'ammo_12g', name: 'Amun. 12 gauge', price: 2.50, quantity: 25 },
  { id: 'ammo_elephant', name: 'Amunicja na słonie', price: 5, quantity: 10 },
  { id: 'strzaly_luk', name: 'Strzały do łuku (12 szt.)', price: 2, quantity: 12 },
  { id: 'belty_kusza', name: 'Bełty do kuszy (12 szt.)', price: 3, quantity: 12 },
]
