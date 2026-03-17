export interface ContactSubcategoryData {
  id: string
  name: string
  category_id: string
  flavor: string
}

export interface ContactCategoryData {
  id: string
  name: string
  subcategories: ContactSubcategoryData[]
}

export const CONTACT_CATEGORIES_NEW: ContactCategoryData[] = [
  // 1. ORGANY SCIGANIA
  {
    id: 'ORGANY_SCIGANIA',
    name: 'W organach ścigania',
    subcategories: [
      {
        id: 'policja_miejska',
        name: 'Policja miejska',
        category_id: 'ORGANY_SCIGANIA',
        flavor: 'Szeregowi i detektywi: mogą przymknąć oko, ostrzec przed nalotami lub udostępnić akta.',
      },
      {
        id: 'detektywi_prywatni',
        name: 'Detektywi prywatni i agencyjni',
        category_id: 'ORGANY_SCIGANIA',
        flavor: 'Specjaliści od inwigilacji i tropienia: dyskretne usługi za odpowiednią opłatą.',
      },
      {
        id: 'prokuratura_sady',
        name: 'Prokuratura i sądy',
        category_id: 'ORGANY_SCIGANIA',
        flavor: 'Prokuratorzy, sędziowie, urzędnicy sądowi: wpływ na bieg postępowań.',
      },
      {
        id: 'sluzby_celne',
        name: 'Służby celne i graniczne',
        category_id: 'ORGANY_SCIGANIA',
        flavor: 'Celnicy i strażnicy graniczni: mogą przepuścić przesyłkę lub zamknąć szlak.',
      },
      {
        id: 'sluzby_specjalne',
        name: 'Służby specjalne / wywiad',
        category_id: 'ORGANY_SCIGANIA',
        flavor: 'Agenci federalni i oficerowie wywiadu: informacje, które nie trafiają do prasy.',
      },
      {
        id: 'straz_wiezienna',
        name: 'Straż więzienna',
        category_id: 'ORGANY_SCIGANIA',
        flavor: 'Klucze do cel i uszy za murami: wiadomości z więzień, widzenia poza kolejką.',
      },
    ],
  },

  // 2. POLSWIATEK
  {
    id: 'POLSWIATEK',
    name: 'W półświatku',
    subcategories: [
      {
        id: 'gangi_uliczne',
        name: 'Gangi uliczne',
        category_id: 'POLSWIATEK',
        flavor: 'Opryszki, ochroniarze, najemnicy: siła pięści dostępna na telefon.',
      },
      {
        id: 'przemytnicy',
        name: 'Przemytnicy (alkohol, towary)',
        category_id: 'POLSWIATEK',
        flavor: 'Szlaki przez jeziora i tunele: dostęp do zakazanych towarów i tras ucieczki.',
      },
      {
        id: 'hazard_domy_gry',
        name: 'Hazard i domy gry',
        category_id: 'POLSWIATEK',
        flavor: 'Krupierzy, bukmacherzy, szulerzy: stół pokerowy to skarbnica plotek.',
      },
      {
        id: 'paserzy',
        name: 'Paserzy i czarny rynek',
        category_id: 'POLSWIATEK',
        flavor: 'Handel kradzionym towarem: każdy przedmiot ma swoją cenę, bez pytań.',
      },
      {
        id: 'rozrywka_domy',
        name: 'Rozrywka i domy schadzek',
        category_id: 'POLSWIATEK',
        flavor: 'Dansigi, burdele i speakeasy: tu plotki krążą szybciej niż gin.',
      },
      {
        id: 'lichwiarze',
        name: 'Lichwiarze i wymuszone długi',
        category_id: 'POLSWIATEK',
        flavor: 'Pożyczka bez formalności: ale cena zwłoki bywa bolesna.',
      },
    ],
  },

  // 3. AKADEMIA
  {
    id: 'AKADEMIA',
    name: 'W środowisku akademickim',
    subcategories: [
      {
        id: 'profesorowie',
        name: 'Profesorowie i wykładowcy',
        category_id: 'AKADEMIA',
        flavor: 'Eksperci w swoich dziedzinach: mogą rozszyfrować inskrypcję lub wskazać źródło.',
      },
      {
        id: 'archiwisci',
        name: 'Archiwiści i bibliotekarze',
        category_id: 'AKADEMIA',
        flavor: 'Strażnicy wiedzy: wiedzą, gdzie leży zapomniany rękopis.',
      },
      {
        id: 'muzea_kolekcjonerzy',
        name: 'Muzea i kolekcjonerzy',
        category_id: 'AKADEMIA',
        flavor: 'Kustosze, kuratorzy i prywatni zbieracze: ocenią artefakt i wskażą jego pochodzenie.',
      },
      {
        id: 'instytuty',
        name: 'Instytuty badawcze',
        category_id: 'AKADEMIA',
        flavor: 'Laboratoria i pracownie: analiza próbek, eksperymenty, raporty naukowe.',
      },
      {
        id: 'towarzystwa_naukowe',
        name: 'Towarzystwa naukowe',
        category_id: 'AKADEMIA',
        flavor: 'Elitarne gremia uczonych: rekomendacje, publikacje i zaproszenia na wykłady.',
      },
      {
        id: 'eksperci_sadowi',
        name: 'Eksperci sądowi i biegli',
        category_id: 'AKADEMIA',
        flavor: 'Specjaliści od dowodów: analiza balistyczna, grafologiczna, toksykologiczna.',
      },
      {
        id: 'antykwariusze_bibliofile',
        name: 'Antykwariusze i bibliofile',
        category_id: 'AKADEMIA',
        flavor: 'Prywatne zbiory, rzadkie egzemplarze, sieci wymiany których nie ma w katalogach.',
      },
    ],
  },

  // 4. MEDYCY
  {
    id: 'MEDYCY',
    name: 'Wśród medyków',
    subcategories: [
      {
        id: 'lekarze',
        name: 'Lekarze i chirurdzy',
        category_id: 'MEDYCY',
        flavor: 'Opatrzenie ran bez raportów: dyskretna pomoc medyczna o każdej porze.',
      },
      {
        id: 'psychiatrzy',
        name: 'Psychiatrzy i psycholodzy',
        category_id: 'MEDYCY',
        flavor: 'Specjaliści od umysłu: mogą ocenić poczytalność lub przyjąć kogoś na obserwację.',
      },
      {
        id: 'patolodzy',
        name: 'Patolodzy i medycyna sądowa',
        category_id: 'MEDYCY',
        flavor: 'Sekcje zwłok i analiza toksyn: prawda wypisana na ciele ofiary.',
      },
      {
        id: 'farmaceuci',
        name: 'Farmaceuci i aptekarze',
        category_id: 'MEDYCY',
        flavor: 'Dostęp do leków i substancji: morfina, laudanum, trucizny na receptę lub bez.',
      },
      {
        id: 'personel_szpitalny',
        name: 'Personel szpitalny',
        category_id: 'MEDYCY',
        flavor: 'Pielęgniarki, salowi, sanitariusze: oczy i uszy na każdym oddziale.',
      },
      {
        id: 'znachorzy_medycyna_ludowa',
        name: 'Znachorzy i medycyna ludowa',
        category_id: 'MEDYCY',
        flavor: 'Zielarze, babki i uzdrowiciele: starożytne metody, których nauka nie uznaje.',
      },
    ],
  },

  // 5. PRASA_MEDIA
  {
    id: 'PRASA_MEDIA',
    name: 'W prasie i mediach',
    subcategories: [
      {
        id: 'dziennikarze',
        name: 'Dziennikarze i reporterzy',
        category_id: 'PRASA_MEDIA',
        flavor: 'Tropiciele sensacji: mogą nagłośnić sprawę lub wstrzymać artykuł.',
      },
      {
        id: 'wydawcy',
        name: 'Wydawcy i redaktorzy',
        category_id: 'PRASA_MEDIA',
        flavor: 'Decydenci prasy: kontrolują, co trafi na pierwszą stronę.',
      },
      {
        id: 'fotografowie',
        name: 'Fotografowie prasowi',
        category_id: 'PRASA_MEDIA',
        flavor: 'Oko aparatu: zdjęcie warte tysiąca słów, a czasem czyjegoś alibi.',
      },
      {
        id: 'radio',
        name: 'Radio i nowe media',
        category_id: 'PRASA_MEDIA',
        flavor: 'Głos eteru: komunikaty radiowe docierają tam, gdzie gazeta nie sięga.',
      },
      {
        id: 'plotkarze',
        name: 'Plotkarze i informatorzy',
        category_id: 'PRASA_MEDIA',
        flavor: 'Sieć szeptów: wiedzą, kto z kim sypia, kto komu jest winien i dlaczego.',
      },
    ],
  },

  // 6. PRAWNICY_BIZNES
  {
    id: 'PRAWNICY_BIZNES',
    name: 'Wśród prawników, finansistów i biznesu',
    subcategories: [
      {
        id: 'politycy',
        name: 'Politycy i urzędnicy miejscy',
        category_id: 'PRAWNICY_BIZNES',
        flavor: 'Burmistrz, rajcowie, inspektorzy: odpowiedni telefon otwiera każde drzwi.',
      },
      {
        id: 'bankierzy',
        name: 'Bankierzy i finansiści',
        category_id: 'PRAWNICY_BIZNES',
        flavor: 'Ludzie od pieniędzy: pożyczki, informacje o kontach, dyskretne przelewy.',
      },
      {
        id: 'przemyslowcy',
        name: 'Przemysłowcy i fabrykanci',
        category_id: 'PRAWNICY_BIZNES',
        flavor: 'Magnaci przemysłowi: dostęp do fabryk, transportu i siły roboczej.',
      },
      {
        id: 'prawnicy',
        name: 'Prawnicy i notariusze',
        category_id: 'PRAWNICY_BIZNES',
        flavor: 'Doradcy prawni: umowy, testamenty, kaucje i kruczki prawne.',
      },
      {
        id: 'wlasciciele_ziemscy',
        name: 'Właściciele ziemscy i dzierżawcy',
        category_id: 'PRAWNICY_BIZNES',
        flavor: 'Panowie ziemi: kontrolują grunty, budynki i to, co się na nich dzieje.',
      },
      {
        id: 'dyplomaci',
        name: 'Dyplomaci i konsulaty',
        category_id: 'PRAWNICY_BIZNES',
        flavor: 'Zagraniczne wpływy: paszporty, immunitety i kanały komunikacji.',
      },
    ],
  },

  // 7. KREGGI_TOWARZYSKIE
  {
    id: 'KREGGI_TOWARZYSKIE',
    name: 'W kręgach towarzyskich',
    subcategories: [
      {
        id: 'kluby_dzentelmenow',
        name: 'Kluby dżentelmenów',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Ekskluzywne salony: brandy, cygara i rozmowy, które kształtują miasto.',
      },
      {
        id: 'loze_masony',
        name: 'Loże masońskie i bractwa',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Tajne uściski dłoni: bracia pomagają braciom, bez zbędnych pytań.',
      },
      {
        id: 'towarzystwa_podroz',
        name: 'Towarzystwa podróżnicze',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Odkrywcy i globtroterzy: znają każdy port, każdą dżunglę i każdą pustynię.',
      },
      {
        id: 'kluby_sportowe',
        name: 'Kluby sportowe (golf, tenis, polo)',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Sportowa elita: na korcie i polu golfowym zawiera się najlepsze układy.',
      },
      {
        id: 'towarzystwa_lit',
        name: 'Towarzystwa literackie i artystyczne',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Bohema i mecenasi: artyści, poeci i ich zamożni protektorzy.',
      },
      {
        id: 'stowarzyszenia_charytat',
        name: 'Stowarzyszenia charytatywne',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Damy patronackie i filantropi: zbiórki, bale i dostęp do wyższych sfer.',
      },
      {
        id: 'srodowiska_imigrantow',
        name: 'Środowiska imigrantów i diaspory',
        category_id: 'KREGGI_TOWARZYSKIE',
        flavor: 'Chinatown, Little Italy, dzielnice żydowskie: osobne światy z własnymi regułami.',
      },
    ],
  },

  // 8. WOJSKO_WETERANI
  {
    id: 'WOJSKO_WETERANI',
    name: 'Wśród wojska i weteranów',
    subcategories: [
      {
        id: 'oficerowie',
        name: 'Oficerowie czynni',
        category_id: 'WOJSKO_WETERANI',
        flavor: 'Dowódcy garnizonów i baz: rozkazy, transport wojskowy i broń.',
      },
      {
        id: 'weterani',
        name: 'Weterani i stowarzyszenia kombatantów',
        category_id: 'WOJSKO_WETERANI',
        flavor: 'Bracia broni: lojalność okopowa przetrwa każdą dekadę.',
      },
      {
        id: 'jednostki_rez',
        name: 'Jednostki rezerwowe',
        category_id: 'WOJSKO_WETERANI',
        flavor: 'Żołnierze cywilnego życia: gotowi na wezwanie, z bronią w szafie.',
      },
      {
        id: 'dostawcy_wojsk',
        name: 'Dostawcy wojskowi i uzbrojenie',
        category_id: 'WOJSKO_WETERANI',
        flavor: 'Handlarze bronią i amunicją: legalni i mniej legalni dostawcy sprzętu.',
      },
    ],
  },

  // 9. OKULTYZM
  {
    id: 'OKULTYZM',
    name: 'W kręgach okultystycznych',
    subcategories: [
      {
        id: 'spirytysci',
        name: 'Spirytyści i medium',
        category_id: 'OKULTYZM',
        flavor: 'Pośrednicy zaświatów: seanse, tablice Ouija i głosy zza zasłony.',
      },
      {
        id: 'kolekcjonerzy_ant',
        name: 'Kolekcjonerzy antyków i osobliwości',
        category_id: 'OKULTYZM',
        flavor: 'Zbieracze dziwności: mumie, amulety, szczątki i rzeczy, które nie powinny istnieć.',
      },
      {
        id: 'tajne_bractwa',
        name: 'Tajne bractwa i loże ezoteryczne',
        category_id: 'OKULTYZM',
        flavor: 'Hermetycy, różokrzyżowcy, teozofowie: rytuały i wiedzą tajemna.',
      },
      {
        id: 'eksperci_folkloru',
        name: 'Eksperci folkloru i legend',
        category_id: 'OKULTYZM',
        flavor: 'Znawcy mitów i podań ludowych: każda legenda ma ziarno prawdy.',
      },
      {
        id: 'handlarze_ksiag',
        name: 'Handlarze rzadkimi księgami',
        category_id: 'OKULTYZM',
        flavor: 'Antykwariusze okultystyczni: grimuary, zwoje i tomy, których lepiej nie czytać.',
      },
    ],
  },

  // 10. ZIEMIANSTWO_WIES
  {
    id: 'ZIEMIANSTWO_WIES',
    name: 'Ziemiaństwo i wieś',
    subcategories: [
      {
        id: 'farmerzy_ranczerzy',
        name: 'Farmerzy i ranczerzy',
        category_id: 'ZIEMIANSTWO_WIES',
        flavor: 'Ludzie ziemi: znają każdą ścieżkę, każdą jaskinię i każdą lokalną legendę.',
      },
      {
        id: 'mysliwi_traperzy',
        name: 'Myśliwi i traperzy',
        category_id: 'ZIEMIANSTWO_WIES',
        flavor: 'Tropiciele w dziczy: przetrwanie, orientacja i strzał na sto jardów.',
      },
      {
        id: 'duchowni_wiejscy',
        name: 'Duchowni wiejscy i lokalni kaznodzieje',
        category_id: 'ZIEMIANSTWO_WIES',
        flavor: 'Pasterze małych stad: znają sekrety parafian i duchy starych cmentarzy.',
      },
      {
        id: 'szeryf_ochrona',
        name: 'Szeryf i lokalna ochrona',
        category_id: 'ZIEMIANSTWO_WIES',
        flavor: 'Prawo za miastem: jeden człowiek z gwiazdą i strzelbą na krańcu cywilizacji.',
      },
      {
        id: 'rdzenne_spolecznosci',
        name: 'Rdzenni mieszkańcy i starszyzna',
        category_id: 'ZIEMIANSTWO_WIES',
        flavor: 'Pamięć pokoleń: wiedzą o rzeczach starszych niż białe osady.',
      },
    ],
  },
]

// ── Helper functions ──────────────────────────────────────────

export function findSubcategory(id: string): ContactSubcategoryData | null {
  for (const cat of CONTACT_CATEGORIES_NEW) {
    const sub = cat.subcategories.find((s) => s.id === id)
    if (sub) return sub
  }
  return null
}

export function getAllSubcategories(): ContactSubcategoryData[] {
  return CONTACT_CATEGORIES_NEW.flatMap((cat) => cat.subcategories)
}
