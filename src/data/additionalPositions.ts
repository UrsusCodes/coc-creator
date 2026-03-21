/**
 * Additional Position Options
 * 67 regular options + 14 attribute-special options (81 total)
 * Unlocked based on skills, attributes, wealth, age, or occupation group.
 */

export interface UnlockCondition {
  type: 'skill' | 'attribute' | 'wealth' | 'age' | 'occupation_group'
  key: string
  threshold: number
  weight: number
}

export interface AdditionalPositionOption {
  id: string
  title: string
  category: string
  organization_size: 'Mikro' | 'Mała' | 'Średnia'
  unlock: UnlockCondition[]
  flavor: string
  placeholder: string
  is_attribute_special?: boolean
  attribute_key?: string
  occupation_group_required?: string[]
}

// ═══════════════════════════════════════════════════════════════
// BOJOWE I FIZYCZNE (10)
// ═══════════════════════════════════════════════════════════════

const BOJOWE_I_FIZYCZNE: AdditionalPositionOption[] = [
  {
    id: 'klub_sztuk_walki',
    title: 'Klub sztuk walki',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'walka_wrecz:bijatyka', threshold: 50, weight: 2.0 },
    ],
    flavor: 'Trening, dyscyplina i szacunek: klub, w którym pięści mówią za siebie.',
    placeholder: 'np. Klub bokserski Mulligan\'s na South Side. Trenujesz tu trzy razy w tygodniu. Znasz każdego twardziela w okolicy.',
  },
  {
    id: 'druzyna_robotnicza',
    title: 'Drużyna robotnicza',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'walka_wrecz:bijatyka', threshold: 30, weight: 1.2 },
      { type: 'attribute', key: 'STR', threshold: 50, weight: 1.0 },
    ],
    occupation_group_required: [
      'pracownik_fizyczny', 'kowboj', 'farmer', 'marynarz', 'mechanik',
      'bokser_zapasnik', 'wojskowy_zolnierz', 'traper', 'nurek',
      'wspinacz_wysokogorski', 'lowca_grubego_zwierza', 'strazak', 'poszukiwacz',
      'drwal', 'gornik', 'pracownik_fizyczny_niewykwalifikowany',
      'przemytnik_alkoholu_bandyta', 'rabus', 'uliczny_chuligan',
    ],
    flavor: 'Grupa robociarzy, którzy trzymają się razem: na budowie, w porcie i po godzinach.',
    placeholder: 'np. Ekipa dokerów z Pier 17. Razem pracujecie, razem pijecie, razem się bijacie. Nikt z zewnątrz nie wchodzi bez zaproszenia.',
  },
  {
    id: 'klub_szermierczy',
    title: 'Klub szermierczy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'walka_wrecz:dluga_ostra', threshold: 50, weight: 2.0 },
    ],
    flavor: 'Elegancja klingi i tradycja pojedynku: szermierka to sztuka, nie bójka.',
    placeholder: 'np. Fencing Academy of New York. Ekskluzywne treningi z europejskimi mistrzami. Biała broń i dobre maniery.',
  },
  {
    id: 'stowarzyszenie_strzeleckie',
    title: 'Stowarzyszenie strzeleckie',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'bron_palna:krotka', threshold: 50, weight: 1.8 },
      { type: 'skill', key: 'bron_palna:karabin_strzelba', threshold: 50, weight: 1.8 },
    ],
    flavor: 'Strzał, przeładowanie, strzał: braterstwo prochu i celności.',
    placeholder: 'np. National Rifle Association, oddział stanowy. Zawody strzeleckie w weekendy, wspólne polowania jesienią.',
  },
  {
    id: 'klub_sportowy_elitarny',
    title: 'Elitarny klub sportowy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'wealth', key: 'majetnosc', threshold: 40, weight: 1.5 },
      { type: 'attribute', key: 'APP', threshold: 60, weight: 1.2 },
    ],
    flavor: 'Tenis, polo, golf: sport to pretekst, kontakty to cel.',
    placeholder: 'np. Westchester Country Club. Korty tenisowe, pole golfowe, basen. Członkostwo kosztuje, ale drzwi otwiera.',
  },
  {
    id: 'stowarzyszenie_iluzjonistow',
    title: 'Stowarzyszenie iluzjonistów',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'zreczne_palce', threshold: 40, weight: 1.8 },
      { type: 'attribute', key: 'DEX', threshold: 70, weight: 1.5 },
    ],
    flavor: 'Sztuczki, triki i sekrety: im szybsze ręce, tym większy podziw.',
    placeholder: 'np. Society of American Magicians. Pokazy na scenach, wymiana sztuczek w zapleczach. Houdini był jednym z was.',
  },
  {
    id: 'klub_automobilowy',
    title: 'Klub automobilowy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'prowadzenie_samochodu', threshold: 50, weight: 1.5 },
      { type: 'wealth', key: 'majetnosc', threshold: 30, weight: 0.8 },
    ],
    flavor: 'Silnik, prędkość i otwarta droga: klub dla tych, którzy kochają jazdę.',
    placeholder: 'np. American Automobile Association, oddział lokalny. Rajdy, zloty, wymiana części. Twój Ford T jest twoją dumą.',
  },
  {
    id: 'klub_lotniczy',
    title: 'Klub lotniczy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'pilotowanie', threshold: 50, weight: 2.0 },
    ],
    flavor: 'Niebo jest dla odważnych: garstka pilotów, którzy latają dla przyjemności.',
    placeholder: 'np. Aeroklub na lotnisku polowym pod miastem. Trzy dwupłatowce, sześć pilotów, jeden mechanik i niekończące się opowieści.',
  },
  {
    id: 'klub_wspinaczkowy',
    title: 'Klub wspinaczkowy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'wspinaczka', threshold: 50, weight: 1.8 },
    ],
    flavor: 'Skała, lina i zaufanie: klub dla tych, którzy patrzą w górę.',
    placeholder: 'np. Appalachian Mountain Club. Weekendowe wyprawy, letnie obozy, zimowe wejścia. Każdy szczyt to nowy cel.',
  },
  {
    id: 'klub_nurkow',
    title: 'Klub nurków',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'plywanie', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'nurkowanie', threshold: 30, weight: 1.8 },
    ],
    flavor: 'Pod wodą nie ma kłamstw: tylko cisza, ciemność i to, co kryje głębia.',
    placeholder: 'np. Grupa nurków z przystani w Gloucester. Nurkujecie przy wrakach, szukacie skarbów, czasem znajdujecie coś dziwnego.',
  },
]

// ═══════════════════════════════════════════════════════════════
// INTELEKTUALNE I AKADEMICKIE (9)
// ═══════════════════════════════════════════════════════════════

const INTELEKTUALNE_I_AKADEMICKIE: AdditionalPositionOption[] = [
  {
    id: 'klub_czytelniczy_robotniczy',
    title: 'Robotniczy klub czytelniczy',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'INT', threshold: 50, weight: 1.0 },
    ],
    flavor: 'Książki nie są tylko dla bogatych: robotnicy też czytają, myślą i dyskutują.',
    placeholder: 'np. Czytelnia przy fabryce tekstylnej na East Side. Wieczorami zbieracie się nad Dickensem, Twain\'em i gazetami.',
  },
  {
    id: 'klub_szachowy',
    title: 'Klub szachowy',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'INT', threshold: 70, weight: 2.0 },
    ],
    flavor: 'Sześćdziesiąt cztery pola, nieskończone możliwości: tu wygrywa rozum, nie siła.',
    placeholder: 'np. Manhattan Chess Club. Ciche sale, zegary szachowe, intensywne spojrzenia. Tu nikt nie rozmawia: tu się myśli.',
  },
  {
    id: 'towarzystwo_historyczne',
    title: 'Towarzystwo historyczne',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.8 },
      { type: 'attribute', key: 'INT', threshold: 60, weight: 1.2 },
    ],
    flavor: 'Przeszłość to klucz do teraźniejszości: ci ludzie wiedzą, skąd przychodzimy.',
    placeholder: 'np. New England Historical Society. Odczyty, wystawy, archiwa. Członkowie wiedzą więcej o tym mieście niż ktokolwiek żyjący.',
  },
  {
    id: 'klub_geograficzny',
    title: 'Klub geograficzny',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nawigacja', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.2 },
      { type: 'skill', key: 'archeologia', threshold: 50, weight: 1.5 },
    ],
    flavor: 'Mapy, kompasy i marzenia o dalekich lądach: geografowie wiedzą, gdzie prowadzi droga.',
    placeholder: 'np. National Geographic Society, oddział lokalny. Prelekcje podróżników, mapy na ścianach, globusy na biurkach.',
  },
  {
    id: 'towarzystwo_astronomiczne_amatorzy',
    title: 'Towarzystwo astronomiczne (amatorskie)',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Astronomia', threshold: 30, weight: 1.5 },
      { type: 'attribute', key: 'INT', threshold: 50, weight: 0.8 },
    ],
    flavor: 'Teleskopy, gwiazdy i nocne czuwanie: amatorzy, którzy patrzą w niebo z nadzieją.',
    placeholder: 'np. Klub miłośników astronomii przy bibliotece miejskiej. Obserwacje z dachu, dyskusje o kometach, mapy nieba na ścianach.',
  },
  {
    id: 'towarzystwo_astronomiczne_naukowe',
    title: 'Towarzystwo astronomiczne (naukowe)',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Astronomia', threshold: 60, weight: 2.5 },
      { type: 'attribute', key: 'INT', threshold: 75, weight: 1.5 },
    ],
    flavor: 'Poważna nauka, poważni ludzie: tu liczy się precyzja, dane i publikacje.',
    placeholder: 'np. American Astronomical Society. Dostęp do obserwatoriów, współpraca z uniwersytetami, publikacje w prestiżowych czasopismach.',
  },
  {
    id: 'klub_jezykowy',
    title: 'Klub językowy',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'jezyk_obcy', threshold: 60, weight: 1.8 },
    ],
    flavor: 'Każdy język to nowe okno na świat: poligloci wiedzą to najlepiej.',
    placeholder: 'np. Cercle Français przy uniwersytecie. Wieczory konwersacyjne, lektury w oryginale, okazjonalne wizyty gości z Europy.',
  },
  {
    id: 'klub_tekstow_symboli',
    title: 'Klub tekstów i symboli',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'jezyk_obcy', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'okultyzm', threshold: 30, weight: 1.2 },
    ],
    flavor: 'Starożytne teksty, zapomniane symbole: grupa, która czyta między wierszami.',
    placeholder: 'np. Nieformalne seminarium w piwnicy antykwariatu. Deszyfrujecie inskrypcje, analizujecie symbole, tłumaczycie fragmenty manuskryptów.',
  },
  {
    id: 'klub_filozoficzny',
    title: 'Klub filozoficzny',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'INT', threshold: 75, weight: 2.0 },
      { type: 'skill', key: 'perswazja', threshold: 60, weight: 1.5 },
    ],
    flavor: 'Wielkie pytania, ostre umysły: tu każda teza musi przetrwać krzyżowy ogień argumentów.',
    placeholder: 'np. Philosophical Society przy Columbia University. Debaty o etyce, epistemologii i naturze rzeczywistości. Sokrates byłby dumny.',
  },
]

// ═══════════════════════════════════════════════════════════════
// NAUKOWE I BADAWCZE (12)
// ═══════════════════════════════════════════════════════════════

const NAUKOWE_I_BADAWCZE: AdditionalPositionOption[] = [
  {
    id: 'krag_chemikow',
    title: 'Krąg chemików',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'nauka:Chemia', threshold: 30, weight: 1.5 },
    ],
    flavor: 'Probówki, odczynniki i zapach siarki: chemia to nie teoria, to praktyka.',
    placeholder: 'np. Nieformalna grupa chemików-amatorów. Spotkacie się w garażu, eksperymentujecie, czasem coś wybucha.',
  },
  {
    id: 'laboratorium_prywatne',
    title: 'Laboratorium prywatne',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'nauka:Chemia', threshold: 50, weight: 2.0 },
      { type: 'skill', key: 'nauka:Farmacja', threshold: 50, weight: 2.0 },
    ],
    flavor: 'Twoje własne laboratorium: nikt nie kontroluje, co tu powstaje.',
    placeholder: 'np. Piwnica z destylatorami, palnikami i półkami pełnymi odczynników. Pracujesz po nocach, nikt nie pyta o wyniki.',
  },
  {
    id: 'towarzystwo_biologiczne',
    title: 'Towarzystwo biologiczne',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Biologia', threshold: 50, weight: 1.8 },
      { type: 'skill', key: 'nauka:Zoologia', threshold: 50, weight: 1.8 },
      { type: 'skill', key: 'wiedza_o_naturze', threshold: 50, weight: 1.3 },
    ],
    flavor: 'Życie we wszystkich formach: od jednokomórkowców po wieloryby, tu badają wszystko.',
    placeholder: 'np. Biological Society of New England. Wycieczki terenowe, preparaty, wykłady. Członkowie znają każdego ptaka i każdy grzyb.',
  },
  {
    id: 'towarzystwo_entomologiczne',
    title: 'Towarzystwo entomologiczne',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'nauka:Biologia', threshold: 50, weight: 1.3 },
      { type: 'skill', key: 'nauka:Zoologia', threshold: 50, weight: 1.3 },
    ],
    flavor: 'Owady są wszędzie: ci ludzie wiedzą o nich więcej niż o sąsiadach.',
    placeholder: 'np. Entomological Society of America, oddział stanowy. Kolekcje szpilek, wyprawy łowieckie, mikroskopy i nieskończona cierpliwość.',
  },
  {
    id: 'medycyna_alternatywna',
    title: 'Grupa medycyny alternatywnej',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'medycyna', threshold: 30, weight: 1.0 },
      { type: 'skill', key: 'pierwsza_pomoc', threshold: 50, weight: 0.8 },
    ],
    flavor: 'Zioła, okłady i stare receptury: nie wszystko, co leczy, ma etykietkę apteki.',
    placeholder: 'np. Krąg zielarzy i uzdrowicieli. Spotkania w domu starej pani Chen. Herbaty lecznicze, akupunktura, receptury z Chin i Indii.',
  },
  {
    id: 'towarzystwo_medyczne_badawcze',
    title: 'Towarzystwo medyczne badawcze',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'medycyna', threshold: 60, weight: 2.0 },
    ],
    flavor: 'Najnowsze odkrycia, najlepsi lekarze: tu kształtuje się przyszłość medycyny.',
    placeholder: 'np. Medical Research Society przy szpitalu uniwersyteckim. Seminaria, case studies, eksperymenty kliniczne. Prestiż i odpowiedzialność.',
  },
  {
    id: 'towarzystwo_kryminalistyczne',
    title: 'Towarzystwo kryminalistyczne',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Kryminalistyka', threshold: 40, weight: 2.0 },
    ],
    flavor: 'Odciski palców, plamy krwi, analiza włókien: nauka w służbie sprawiedliwości.',
    placeholder: 'np. International Association for Criminal Identification. Warsztaty, konferencje, wymiana metod. Policja przychodzi do was po odpowiedzi.',
  },
  {
    id: 'krag_meteorologow',
    title: 'Krąg meteorologów',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'nauka:Meteorologia', threshold: 30, weight: 2.0 },
      { type: 'skill', key: 'nauka:Astronomia', threshold: 40, weight: 1.0 },
    ],
    flavor: 'Chmury, wiatr i barometr: ci ludzie wiedzą, co przyniesie jutro.',
    placeholder: 'np. Grupa obserwatorów pogody z okolic Nowej Anglii. Stacje pomiarowe, dzienniki, telegramy ostrzegawcze. Farmerzy im ufają.',
  },
  {
    id: 'krag_inzynierow',
    title: 'Krąg inżynierów',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Inżynieria', threshold: 50, weight: 1.8 },
      { type: 'skill', key: 'mechanika', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'elektryka', threshold: 50, weight: 1.5 },
    ],
    flavor: 'Mosty, silniki, obwody: inżynierowie budują świat, reszta w nim mieszka.',
    placeholder: 'np. American Society of Mechanical Engineers, oddział lokalny. Projekty, prototypy, patenty. Tu rodzą się wynalazki.',
  },
  {
    id: 'towarzystwo_geologiczne',
    title: 'Towarzystwo geologiczne',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Geologia', threshold: 40, weight: 2.0 },
    ],
    flavor: 'Skały mówią tym, którzy potrafią słuchać: miliony lat historii pod stopami.',
    placeholder: 'np. Geological Society of America, oddział wschodni. Wyprawy terenowe, kolekcje minerałów, mapy geologiczne na każdej ścianie.',
  },
  {
    id: 'klub_radioamatorow',
    title: 'Klub radioamatorów',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'elektryka', threshold: 40, weight: 1.8 },
      { type: 'skill', key: 'mechanika', threshold: 50, weight: 1.2 },
    ],
    flavor: 'Fale radiowe łączą ludzi na odległość: lutownica, antena i cały świat.',
    placeholder: 'np. Klub krótkofalowców na poddaszu kamienicy. Samodzielnie budowane nadajniki, nocne łączności z Europą, szyfrowane wiadomości.',
  },
  {
    id: 'krag_fizyki',
    title: 'Krąg fizyki',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'nauka:Fizyka', threshold: 60, weight: 2.5 },
      { type: 'skill', key: 'nauka:Matematyka', threshold: 60, weight: 2.5 },
      { type: 'attribute', key: 'INT', threshold: 80, weight: 2.0 },
    ],
    flavor: 'Równania, eksperymenty myślowe i granice ludzkiego poznania: fizyka to królowa nauk.',
    placeholder: 'np. Seminarium fizyki teoretycznej na uniwersytecie. Dyskusje o kwantach, względności i strukturze materii. Einstein bywa gościem.',
  },
]

// ═══════════════════════════════════════════════════════════════
// ARTYSTYCZNE I KULTURALNE (7)
// ═══════════════════════════════════════════════════════════════

const ARTYSTYCZNE_I_KULTURALNE: AdditionalPositionOption[] = [
  {
    id: 'krag_artystyczny_robotniczy',
    title: 'Robotniczy krąg artystyczny',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'sztuka_rzemioslo', threshold: 30, weight: 1.0 },
    ],
    flavor: 'Sztuka nie potrzebuje pieniędzy: wystarczą ręce, wyobraźnia i kawałek węgla.',
    placeholder: 'np. Grupa rysowników z fabryki. Szkice na papierze pakowym, akwarele w przerwach obiadowych, wystawy w stołówce.',
  },
  {
    id: 'klub_pisarski',
    title: 'Klub pisarski',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'sztuka_rzemioslo:Aktorstwo', threshold: 30, weight: 1.2 },
      { type: 'skill', key: 'jezyk_ojczysty', threshold: 70, weight: 1.8 },
      { type: 'attribute', key: 'INT', threshold: 60, weight: 1.0 },
    ],
    flavor: 'Słowa mają moc: pisarze wiedzą to lepiej niż ktokolwiek.',
    placeholder: 'np. Writers\' Circle w kawiarni na Greenwich Village. Czytanie fragmentów, krytyka, dyskusje. Hemingway tu zaczynał.',
  },
  {
    id: 'klub_muzyczny_amatorski',
    title: 'Klub muzyczny (amatorski)',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'sztuka_rzemioslo', threshold: 30, weight: 1.0 },
    ],
    flavor: 'Muzyka łączy ludzi: nie musisz być wirtuozem, wystarczy, że grasz z sercem.',
    placeholder: 'np. Orkiestra strażacka lub kościelny chór. Próby w piwnicy, koncerty na festynach, wspólne śpiewy po godzinach.',
  },
  {
    id: 'klub_muzyczny_profesjonalny',
    title: 'Klub muzyczny (profesjonalny)',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'sztuka_rzemioslo', threshold: 60, weight: 2.0 },
    ],
    flavor: 'Profesjonalni muzycy, poważna muzyka: tu liczy się talent i technika.',
    placeholder: 'np. Musicians\' Union Hall. Zawodowi muzycy, agenci, impresariowie. Kontrakty na występy, nagrania, tournée.',
  },
  {
    id: 'klub_fotograficzny',
    title: 'Klub fotograficzny',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'sztuka_rzemioslo:Fotografia', threshold: 40, weight: 2.0 },
    ],
    flavor: 'Światło, cień i chwila: fotografia utrwala to, co przemija.',
    placeholder: 'np. Camera Club of New York. Ciemnia wspólna, wystawy, wycieczki fotograficzne. Alfred Stieglitz bywał tu gościem.',
  },
  {
    id: 'salon_artystyczny',
    title: 'Salon artystyczny',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'sztuka_rzemioslo', threshold: 50, weight: 2.0 },
      { type: 'attribute', key: 'APP', threshold: 60, weight: 1.2 },
    ],
    flavor: 'Malarstwo, rzeźba, dyskusje o sztuce: salon, gdzie spotykają się twórcy i mecenasi.',
    placeholder: 'np. Salon Mabel Dodge na Fifth Avenue. Artyści, pisarze, rewolucjoniści. Wino, tytoń i gorące debaty do świtu.',
  },
  {
    id: 'klub_teatralny',
    title: 'Klub teatralny',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'charakteryzacja', threshold: 50, weight: 2.0 },
      { type: 'skill', key: 'sztuka_rzemioslo:Aktorstwo', threshold: 50, weight: 2.0 },
      { type: 'skill', key: 'perswazja', threshold: 50, weight: 1.0 },
    ],
    flavor: 'Scena, maska i aplauz: teatr to życie zagrane na serio.',
    placeholder: 'np. Provincetown Players, mały teatr off-Broadway. Amatorzy i profesjonaliści razem na deskach. Eugene O\'Neill tu debiutował.',
  },
]

// ═══════════════════════════════════════════════════════════════
// TOWARZYSKIE I PRESTIŻOWE (7)
// ═══════════════════════════════════════════════════════════════

const TOWARZYSKIE_I_PRESTIZOWE: AdditionalPositionOption[] = [
  {
    id: 'klub_czytelniczy_dzielnicowy',
    title: 'Dzielnicowy klub czytelniczy',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'INT', threshold: 40, weight: 0.8 },
    ],
    flavor: 'Sąsiedzi, herbata i książki: mały klub, który łączy ludzi z okolicy.',
    placeholder: 'np. Klub czytelniczy pani Kowalski. Spotkacie się co czwartek w salonie. Ciastka, herbata, żywe dyskusje o powieściach.',
  },
  {
    id: 'stowarzyszenie_kombatantow',
    title: 'Stowarzyszenie kombatantów',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'age', key: 'wiek', threshold: 30, weight: 1.2 },
    ],
    flavor: 'Wspólne okopy, wspólne wspomnienia: braterstwo, które nie kończy się z wojną.',
    placeholder: 'np. American Legion, Post 127. Weterani Wielkiej Wojny. Spotkania, parady, pomoc wzajemna. Niektóre noce wciąż budzą demony.',
  },
  {
    id: 'tajne_bractwo_loza',
    title: 'Tajne bractwo / loża',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Mała',
    unlock: [
      { type: 'wealth', key: 'majetnosc', threshold: 40, weight: 1.5 },
      { type: 'age', key: 'wiek', threshold: 35, weight: 1.0 },
      { type: 'skill', key: 'perswazja', threshold: 60, weight: 2.0 },
    ],
    flavor: 'Rytuały, przysięgi i braterstwo: za zamkniętymi drzwiami dzieją się ważne rzeczy.',
    placeholder: 'np. Loża masońska Blue Lodge No. 33. Tajne spotkania, inicjacje, wzajemna pomoc. Członkowie to lekarze, prawnicy, politycy.',
  },
  {
    id: 'stowarzyszenie_serwisowe',
    title: 'Stowarzyszenie serwisowe',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'perswazja', threshold: 40, weight: 1.0 },
      { type: 'wealth', key: 'majetnosc', threshold: 30, weight: 0.8 },
    ],
    flavor: 'Służba społeczna, kontakty biznesowe: Rotary, Kiwanis, Lions: filantropia z korzyściami.',
    placeholder: 'np. Rotary Club, oddział miejski. Lunche czwartkowe, zbiórki charytatywne, kontakty z przedsiębiorcami. Wizytówki krążą przy deserze.',
  },
  {
    id: 'klub_elitarny',
    title: 'Elitarny klub dżentelmenów',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Mała',
    unlock: [
      { type: 'wealth', key: 'majetnosc', threshold: 50, weight: 2.0 },
      { type: 'attribute', key: 'APP', threshold: 60, weight: 1.2 },
    ],
    flavor: 'Mahoniowe panele, skórzane fotele i whisky: tu decyzje zapadają przy kominku.',
    placeholder: 'np. Union League Club. Bankierzy, senatorowie, przemysłowcy. Członkostwo tylko z rekomendacji. Kelner zna twoje imię.',
  },
  {
    id: 'klub_bridz',
    title: 'Klub brydżowy',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'INT', threshold: 50, weight: 1.2 },
    ],
    flavor: 'Cztery ręce, trzynaście lew: brydż to gra inteligentna, nie hazardowa.',
    placeholder: 'np. Bridge Club przy hotelu Waldorf. Wtorkowe turnieje, sobotnie partie towarzyskie. Panie w perłach, panowie w garniturach.',
  },
  {
    id: 'salon_kobiecy',
    title: 'Salon kobiecy',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'perswazja', threshold: 50, weight: 1.3 },
      { type: 'skill', key: 'urok_osobisty', threshold: 50, weight: 1.3 },
    ],
    flavor: 'Damy z pozycją, wpływem i wizją: salon, gdzie kobiety kształtują opinię.',
    placeholder: 'np. Women\'s City Club. Żony senatorów, pisarki, działaczki. Herbata o piątej, a do tego polityka, sztuka i plotki.',
  },
]

// ═══════════════════════════════════════════════════════════════
// OKULTYSTYCZNE I TAJEMNICZE (7)
// ═══════════════════════════════════════════════════════════════

const OKULTYSTYCZNE_I_TAJEMNICZE: AdditionalPositionOption[] = [
  {
    id: 'krag_spirytystyczny_amatorski',
    title: 'Krąg spirytystyczny (amatorski)',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 30, weight: 1.2 },
      { type: 'attribute', key: 'POW', threshold: 50, weight: 0.8 },
    ],
    flavor: 'Stukanie w stolik, drżące świece: amatorzy szukają kontaktu z tamtą stroną.',
    placeholder: 'np. Seans spirytystyczny w salonie pani Blackwood. Pięć osób, okrągły stolik, tabliczka Ouija. Nikt nie wie, co naprawdę odpowiada.',
  },
  {
    id: 'krag_spirytystyczny_powazny',
    title: 'Krąg spirytystyczny (poważny)',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 50, weight: 2.0 },
      { type: 'attribute', key: 'POW', threshold: 70, weight: 1.8 },
    ],
    flavor: 'To nie zabawa: ci ludzie naprawdę rozmawiają z duchami. Albo tak im się wydaje.',
    placeholder: 'np. Krąg medium Eusapii Palladino. Seanse w ciemności, ektoplazma, głosy znikąd. Sceptycy tu nie wchodzą.',
  },
  {
    id: 'towarzystwo_filozoficzno_duchowe',
    title: 'Towarzystwo filozoficzno-duchowe',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 40, weight: 1.8 },
      { type: 'attribute', key: 'POW', threshold: 60, weight: 1.5 },
      { type: 'attribute', key: 'INT', threshold: 60, weight: 1.0 },
    ],
    flavor: 'Teozofia, antropozofia, hermetyzm: duchowość z intelektualnym zacięciem.',
    placeholder: 'np. Theosophical Society, oddział bostoński. Wykłady o karmi, reinkarnacji i ukrytych mistrzach. Biblioteka pełna ezoteryków.',
  },
  {
    id: 'towarzystwo_parapsychologiczne',
    title: 'Towarzystwo parapsychologiczne',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 40, weight: 1.8 },
      { type: 'skill', key: 'nauka:Fizyka', threshold: 50, weight: 1.2 },
    ],
    flavor: 'Telepatia, jasnowidzenie, psychokineza: nauka próbuje zbadać to, co nadprzyrodzone.',
    placeholder: 'np. American Society for Psychical Research. Eksperymenty z kartami Zenera, dokumentacja zjawisk, protokoły badawcze. Na granicy nauki i wiary.',
  },
  {
    id: 'bractwo_ezoteryczne',
    title: 'Bractwo ezoteryczne',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 50, weight: 2.5 },
      { type: 'skill', key: 'jezyk_obcy', threshold: 40, weight: 1.0 },
    ],
    flavor: 'Alchemia, kabała, hermetyzm: wiedza zarezerwowana dla wtajemniczonych.',
    placeholder: 'np. Hermetic Order of the Golden Dawn, oddział amerykański. Rytuały, stopnie wtajemniczenia, studia nad Drzewem Życia.',
  },
  {
    id: 'bractwo_wschodnie',
    title: 'Bractwo wschodnie',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 60, weight: 2.5 },
      { type: 'attribute', key: 'POW', threshold: 70, weight: 2.0 },
    ],
    flavor: 'Tantra, joga, sufizm: mądrość Wschodu w zachodnich miastach.',
    placeholder: 'np. Krąg uczniów Swamiego Vivekanady. Medytacje o świcie, studia nad Upaniszadami, praktyki oddechowe. Cisza jest tu najgłośniejsza.',
  },
  {
    id: 'kolekcjonerzy_artefaktow',
    title: 'Kolekcjonerzy artefaktów',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'okultyzm', threshold: 30, weight: 1.3 },
      { type: 'skill', key: 'historia', threshold: 40, weight: 1.0 },
      { type: 'skill', key: 'wycena', threshold: 40, weight: 1.0 },
    ],
    flavor: 'Stare przedmioty mają swoją historię: niektóre lepiej nie otwierać.',
    placeholder: 'np. Prywatna kolekcja dziwnych przedmiotów w piwnicy antykwariatu. Amulety, manuskrypty, artefakty z wykopalisk. Nie wszystko na sprzedaż.',
  },
]

// ═══════════════════════════════════════════════════════════════
// RELIGIJNE I DUCHOWE (4)
// ═══════════════════════════════════════════════════════════════

const RELIGIJNE_I_DUCHOWE: AdditionalPositionOption[] = [
  {
    id: 'komitet_parafialny',
    title: 'Komitet parafialny',
    category: 'RELIGIJNE I DUCHOWE',
    organization_size: 'Mała',
    unlock: [
      { type: 'age', key: 'wiek', threshold: 30, weight: 1.0 },
      { type: 'skill', key: 'perswazja', threshold: 30, weight: 0.8 },
    ],
    flavor: 'Parafia to serce społeczności: komitet decyduje o tym, jak bije.',
    placeholder: 'np. Komitet parafii św. Patryka. Organizacja festynów, zbiórek, opieka nad potrzebującymi. Proboszcz ci ufa.',
  },
  {
    id: 'bractwo_zakonne_swieckie',
    title: 'Bractwo zakonne świeckie',
    category: 'RELIGIJNE I DUCHOWE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'age', key: 'wiek', threshold: 35, weight: 1.0 },
    ],
    flavor: 'Życie świeckie, duch zakonny: modlitwa, praca i pokora bez murów klasztoru.',
    placeholder: 'np. Trzeci zakon franciszkański. Spotkania modlitewne, prace charytatywne, rekolekcje. Skromność i służba bez habitu.',
  },
  {
    id: 'ruch_ewangelikalny',
    title: 'Ruch ewangelikalny',
    category: 'RELIGIJNE I DUCHOWE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'perswazja', threshold: 60, weight: 1.8 },
      { type: 'attribute', key: 'POW', threshold: 60, weight: 1.5 },
    ],
    flavor: 'Ogień wiary, moc kazania: ewangeliści porywają tłumy i zmieniają życia.',
    placeholder: 'np. Billy Sunday Crusade. Namiotowe spotkania, płomienne kazania, masowe nawrócenia. Tysiące ludzi, jedna wiara, jeden głos.',
  },
  {
    id: 'krag_studiow_religijnych',
    title: 'Krąg studiów religijnych',
    category: 'RELIGIJNE I DUCHOWE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'jezyk_obcy', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.2 },
    ],
    flavor: 'Porównywanie religii, analiza tekstów: wiara pod lupą rozumu.',
    placeholder: 'np. Seminarium religioznawcze przy uniwersytecie. Biblia, Koran, Wedy: tłumaczenia, interpretacje, debaty. Wiara i rozum w jednym pokoju.',
  },
]

// ═══════════════════════════════════════════════════════════════
// POLITYCZNE I SPOŁECZNE (5)
// ═══════════════════════════════════════════════════════════════

const POLITYCZNE_I_SPOLECZNE: AdditionalPositionOption[] = [
  {
    id: 'ruch_kobiecy',
    title: 'Ruch kobiecy',
    category: 'POLITYCZNE I SPOŁECZNE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'perswazja', threshold: 40, weight: 1.3 },
      { type: 'age', key: 'wiek', threshold: 25, weight: 0.8 },
    ],
    flavor: 'Równe prawa, równa płaca, równy głos: kobiety walczą o swoją przyszłość.',
    placeholder: 'np. National American Woman Suffrage Association. Petycje, marsze, lobbing. Prawo głosu wywalczone, ale walka o równość trwa.',
  },
  {
    id: 'ruch_robotniczy',
    title: 'Ruch robotniczy',
    category: 'POLITYCZNE I SPOŁECZNE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'zastraszanie', threshold: 30, weight: 1.0 },
      { type: 'skill', key: 'perswazja', threshold: 40, weight: 1.2 },
    ],
    flavor: 'Związki zawodowe, strajki, solidarność: robotnicy razem mają siłę.',
    placeholder: 'np. Związek zawodowy przy zakładach stalowych. Składki, zebrania, negocjacje z dyrekcją. Strajk to ostateczność, ale zawsze opcja.',
  },
  {
    id: 'stowarzyszenie_imigranckie',
    title: 'Stowarzyszenie imigranckie',
    category: 'POLITYCZNE I SPOŁECZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'jezyk_obcy', threshold: 40, weight: 1.5 },
      { type: 'age', key: 'wiek', threshold: 25, weight: 0.7 },
    ],
    flavor: 'Obcy kraj, znajomi ludzie: stowarzyszenie, które pomaga odnaleźć się w nowym świecie.',
    placeholder: 'np. Polish American Association na East Side. Pomoc prawna, kursy angielskiego, wieczory kulturalne. Tu mówisz w swoim języku.',
  },
  {
    id: 'ruch_prohibicji',
    title: 'Ruch prohibicji',
    category: 'POLITYCZNE I SPOŁECZNE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'perswazja', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'prawo', threshold: 40, weight: 1.2 },
    ],
    flavor: 'Alkohol to zło: ci ludzie walczą o trzeźwą Amerykę i nie odpuszczają.',
    placeholder: 'np. Anti-Saloon League, oddział stanowy. Petycje, donosy, naciski na polityków. Speakeasy to wróg, a ty jesteś na froncie.',
  },
  {
    id: 'organizacja_praw_obywatelskich',
    title: 'Organizacja praw obywatelskich',
    category: 'POLITYCZNE I SPOŁECZNE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'perswazja', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'prawo', threshold: 40, weight: 1.5 },
    ],
    flavor: 'Każdy człowiek ma prawa: organizacja, która walczy o ich przestrzeganie.',
    placeholder: 'np. NAACP, oddział lokalny. Obrona praw obywatelskich, procesy sądowe, edukacja. Sprawiedliwość jest ślepa, ale ktoś musi ją prowadzić.',
  },
]

// ═══════════════════════════════════════════════════════════════
// MARGINES I PÓŁŚWIATEK (2)
// ═══════════════════════════════════════════════════════════════

const MARGINES_I_POLSWIATEK: AdditionalPositionOption[] = [
  {
    id: 'podziemna_siec_medyczna',
    title: 'Podziemna sieć medyczna',
    category: 'MARGINES I PÓŁŚWIATEK',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'medycyna', threshold: 40, weight: 1.5 },
      { type: 'skill', key: 'pierwsza_pomoc', threshold: 50, weight: 1.2 },
    ],
    flavor: 'Bez licencji, bez pytań, bez rachunków: leczysz tych, którzy nie mogą iść do szpitala.',
    placeholder: 'np. Zaplecze apteki na Bowery. Kulka do wyjęcia, rana do zszycia, zero protokołów. Gangsterzy płacą gotówką.',
  },
  {
    id: 'siec_przemytnicza',
    title: 'Sieć przemytnicza',
    category: 'MARGINES I PÓŁŚWIATEK',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'prowadzenie_samochodu', threshold: 40, weight: 1.2 },
      { type: 'skill', key: 'gadanina', threshold: 40, weight: 1.2 },
    ],
    flavor: 'Nocne trasy, fałszywe dna i nerwy ze stali: przemyt to nie praca, to styl życia.',
    placeholder: 'np. Rum-runnerzy z wybrzeża Connecticut. Motorówki, fałszywe ładunki, przekupieni celnicy. Dobra whisky z Kanady za podwójną cenę.',
  },
]

// ═══════════════════════════════════════════════════════════════
// EKSPLORATORZY I PRZYGODNICY (5)
// ═══════════════════════════════════════════════════════════════

const EKSPLORATORZY_I_PRZYGODNICY: AdditionalPositionOption[] = [
  {
    id: 'klub_wedrowcow',
    title: 'Klub wędrowców',
    category: 'EKSPLORATORZY I PRZYGODNICY',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'sztuka_przetrwania', threshold: 30, weight: 1.0 },
      { type: 'skill', key: 'nawigacja', threshold: 30, weight: 0.8 },
    ],
    flavor: 'Szlak, plecak i wolność: wędrowcy znają ścieżki, których nie ma na mapach.',
    placeholder: 'np. Hiking Club przy YMCA. Weekendowe wyprawy, nocowanie pod namiotem, śniadanie przy ognisku. Najlepsze widoki za darmo.',
  },
  {
    id: 'towarzystwo_eksploratorow',
    title: 'Towarzystwo eksploratorów',
    category: 'EKSPLORATORZY I PRZYGODNICY',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'nawigacja', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'sztuka_przetrwania', threshold: 50, weight: 1.8 },
    ],
    flavor: 'Niezbadane terytoria, zaginione cywilizacje: eksploratorzy idą tam, gdzie inni się boją.',
    placeholder: 'np. Explorers Club w Nowym Jorku. Flagi wypraw na ścianach, mapy z białymi plamami, opowieści o dżunglach i pustyniach.',
  },
  {
    id: 'wyprawa_badawcza',
    title: 'Wyprawa badawcza',
    category: 'EKSPLORATORZY I PRZYGODNICY',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'archeologia', threshold: 40, weight: 2.0 },
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.5 },
    ],
    flavor: 'Łopata, pędzel i cierpliwość: wyprawa, która odkrywa to, co ziemia ukryła.',
    placeholder: 'np. Ekspedycja archeologiczna na Jukatanie. Pięć osób, namioty w dżungli, ruiny Majów. Każdy dzień przynosi nowe odkrycia.',
  },
  {
    id: 'klub_lowcow',
    title: 'Klub łowców',
    category: 'EKSPLORATORZY I PRZYGODNICY',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'tropienie', threshold: 40, weight: 1.8 },
      { type: 'skill', key: 'bron_palna:karabin_strzelba', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'tresura_zwierzat', threshold: 40, weight: 1.2 },
    ],
    occupation_group_required: [
      'lowca_grubego_zwierza', 'traper', 'kowboj', 'farmer', 'odkrywca',
      'poszukiwacz', 'bogaty_hobbysta', 'dzentelmen', 'wspinacz_wysokogorski',
      'oficer_wojskowy', 'wojskowy_zolnierz',
    ],
    flavor: 'Trop, strzał i trofeum: łowcy znają las lepiej niż własne podwórko.',
    placeholder: 'np. Boone and Crockett Club. Polowania na grubego zwierza, wyprawy w góry, rywalizacja o najlepsze trofeum. Roosevelt był członkiem.',
  },
  {
    id: 'poszukiwacze_skarbow',
    title: 'Poszukiwacze skarbów',
    category: 'EKSPLORATORZY I PRZYGODNICY',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'plywanie', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'nurkowanie', threshold: 30, weight: 2.0 },
    ],
    flavor: 'Wraki, zatopione złoto i legenda: skarby czekają na tych, którzy się zanurzą.',
    placeholder: 'np. Grupa poszukiwaczy wraków u wybrzeży Florydy. Mapy, nurkowanie, wyciąganie artefaktów z dna. Każdy wrak to nowa historia.',
  },
]

// ═══════════════════════════════════════════════════════════════
// SPECJALNE: CECHY 80+ (14)
// ═══════════════════════════════════════════════════════════════

const SPECJALNE_CECHY_80: AdditionalPositionOption[] = [
  // ── MOC (POW) >= 80 ──
  {
    id: 'moc_duchowy_przywodca',
    title: 'Duchowy przywódca',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'POW', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'POW',
    flavor: 'Twoja siła wewnętrzna przyciąga ludzi: widzą w tobie kogoś, kto wie więcej.',
    placeholder: 'np. Mały krąg wyznawców, którzy szukają duchowego przewodnika. Spotykają się w twoim domu, słuchają twoich słów, wierzą w twoją moc.',
  },
  {
    id: 'moc_naturalne_medium',
    title: 'Naturalne medium',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'POW', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'POW',
    flavor: 'Czujesz to, czego inni nie czują: duchy, energie, obecności. Dar czy przekleństwo?',
    placeholder: 'np. Klienci przychodzą po seanse prywatne. Nie reklamujesz się: ludzie sami cię znajdują. Niektóre noce są trudne.',
  },
  {
    id: 'moc_hipnotyzer',
    title: 'Hipnotyzer',
    category: 'OKULTYSTYCZNE I TAJEMNICZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'POW', threshold: 80, weight: 2.5 },
      { type: 'skill', key: 'hipnoza', threshold: 30, weight: 1.0 },
    ],
    is_attribute_special: true,
    attribute_key: 'POW',
    flavor: 'Twoje oczy, twój głos, twoja wola: ludzie robią to, co im każesz.',
    placeholder: 'np. Pokazy hipnozy w salonach i na scenach. Wolontariusze z publiczności, sugestie, transy. Nikt nie wie, jak to robisz. Ty też nie do końca.',
  },

  // ── WYG (APP) >= 80 ──
  {
    id: 'wyg_gwiazda_salonu',
    title: 'Gwiazda salonu',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'APP', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'APP',
    flavor: 'Wchodzisz do pokoju i wszystkie oczy zwracają się na ciebie: uroda otwiera każde drzwi.',
    placeholder: 'np. Zaproszenia na najlepsze przyjęcia w mieście. Gospodarze zabiegają o twoją obecność. Twoja twarz to wizytówka każdego wydarzenia.',
  },
  {
    id: 'wyg_twarz_publiczna',
    title: 'Twarz publiczna',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'APP', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'APP',
    flavor: 'Reklamy, plakaty, gazety: twoja twarz sprzedaje wszystko, od mydła po marzenia.',
    placeholder: 'np. Agencja reklamowa wykorzystuje twój wizerunek. Plakaty z twoją twarzą na Broadway, reklamy w magazynach. Ludzie cię rozpoznają na ulicy.',
  },
  {
    id: 'wyg_aktor_zaproszony',
    title: 'Aktor zaproszony',
    category: 'ARTYSTYCZNE I KULTURALNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'APP', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'APP',
    flavor: 'Scena i ekran: nie musisz umieć grać, wystarczy, że dobrze wyglądasz.',
    placeholder: 'np. Epizody w sztukach teatralnych, statystowanie w filmach. Reżyserzy dzwonią, bo potrzebują „kogoś z twarzą". Talent opcjonalny.',
  },

  // ── SIŁ (STR) >= 80 ──
  {
    id: 'sil_silacz',
    title: 'Siłacz',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'STR', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'STR',
    flavor: 'Gięcie prętów, rwanie łańcuchów: twoja siła to widowisko i narzędzie.',
    placeholder: 'np. Pokazy siłacza na jarmarkach i w cyrku. Podnoszenie ciężarów, łamanie podków. Tłumy oklaskują, a ty zarabiasz na bicepsach.',
  },
  {
    id: 'sil_ochroniarz',
    title: 'Ochroniarz',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'STR', threshold: 80, weight: 2.5 },
      { type: 'skill', key: 'walka_wrecz:bijatyka', threshold: 50, weight: 1.0 },
    ],
    is_attribute_special: true,
    attribute_key: 'STR',
    flavor: 'Twoja postura mówi „nie wchodź": ochrona to praca dla tych, którzy imponują rozmiarem.',
    placeholder: 'np. Ochrona osobista bogatego biznesmena. Stoisz za nim na każdym spotkaniu. Nikt nie próbuje go zaczepić, gdy jesteś w pobliżu.',
  },
  {
    id: 'sil_bractwo_fizyczne',
    title: 'Bractwo fizyczne',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'STR', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'STR',
    flavor: 'Siła łączy silnych: grupa ludzi, dla których mięśnie to sposób na życie.',
    placeholder: 'np. Klub kulturystyczny Sandowa. Ćwiczenia z ciężarami, zawody w podnoszeniu, pokazy muskułów. Tu liczy się masa i symetria.',
  },

  // ── ZRĘ (DEX) >= 80 ──
  {
    id: 'zre_trupa_performerow',
    title: 'Trupa performerów',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'DEX', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'DEX',
    flavor: 'Akrobatyka, żonglerka, taniec: twoje ciało jest twoim instrumentem.',
    placeholder: 'np. Trupa akrobatów-wędrowców. Występy na placach, w parkach, czasem w cyrkach. Salto, piramidy, chodzenie po linie.',
  },
  {
    id: 'zre_srodowisko_artystow_ulicy',
    title: 'Środowisko artystów ulicy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'DEX', threshold: 80, weight: 2.0 },
      { type: 'skill', key: 'zreczne_palce', threshold: 50, weight: 1.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'DEX',
    flavor: 'Sztuczki, triki i zwinne palce: ulica to twoja scena, przechodnie to publiczność.',
    placeholder: 'np. Grupa sztuczkarzy z Coney Island. Karty, monety, kubki: szybsze od oka. Czasem uczciwy zarobek, czasem nie.',
  },

  // ── KON (CON) >= 80 ──
  {
    id: 'kon_sport_wytrzymalosciowy',
    title: 'Sport wytrzymałościowy',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'attribute', key: 'CON', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'CON',
    flavor: 'Maratony, wieloboje, pływanie długodystansowe: twoje ciało nie zna słowa „dość".',
    placeholder: 'np. Klub maratończyków. Treningi o świcie, biegi w deszczu, wyścigi na 26 mil. Ból to stan przejściowy, medal jest wieczny.',
  },

  // ── INT >= 80 ──
  {
    id: 'int_nieformalne_grono_mysli',
    title: 'Nieformalne grono myślicieli',
    category: 'INTELEKTUALNE I AKADEMICKIE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'attribute', key: 'INT', threshold: 80, weight: 2.5 },
    ],
    is_attribute_special: true,
    attribute_key: 'INT',
    flavor: 'Najjaśniejsze umysły spotykają się nieformalnie: geniusz szuka towarzystwa geniuszy.',
    placeholder: 'np. Piątkowe obiady w gronie profesorów i wynalazców. Tesla, Edison, Steinmetz: dyskusje o przyszłości przy dobrym winie.',
  },
]

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

// ── ROZSZERZENIA (v4) ──────────────────────────────────────────────

const ROZSZERZENIA: AdditionalPositionOption[] = [
  {
    id: 'towarzystwo_etnograficzne',
    title: 'Towarzystwo etnograficzne / misjonarze naukowi',
    category: 'AKADEMICKIE: ROZSZERZENIA',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'antropologia', threshold: 40, weight: 2.5 },
      { type: 'skill', key: 'archeologia', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.2 },
    ],
    flavor: 'Ludzkie kultury są starsze i dziwniejsze niż ktokolwiek chce przyznać.',
    placeholder: 'np. Towarzystwo etnograficzne przy muzeum lub akademii. Wyprawy terenowe, wywiady z rdzennymi społecznościami, katalogowanie tradycji. Część zebranych materiałów nie trafia do publikacji.',
  },
  {
    id: 'klub_jezdziecki',
    title: 'Klub jeździecki / polo / hodowcy koni',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'jezdziectwo', threshold: 40, weight: 2.5 },
    ],
    flavor: 'Koń to przepustka do towarzystwa którego pieniądze nie otwierają.',
    placeholder: 'np. Prywatny klub jeździecki za miastem lub stowarzyszenie hodowców. Zawody, pokazy, aukcje koni. Starsze rody i nowe fortuny przy tej samej przeszkodzie.',
  },
  {
    id: 'towarzystwo_bibliofili',
    title: 'Towarzystwo bibliofilów / czytelnia prywatna',
    category: 'AKADEMICKIE: ROZSZERZENIA',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'korzystanie_z_bibliotek', threshold: 50, weight: 2.5 },
      { type: 'skill', key: 'jezyk_obcy', threshold: 40, weight: 1.2 },
      { type: 'skill', key: 'historia', threshold: 40, weight: 1.0 },
    ],
    flavor: 'Niektóre książki istnieją w trzech egzemplarzach na świecie.',
    placeholder: 'np. Prywatne towarzystwo kolekcjonerów ksiąg lub zamknięta czytelnia z dostępem tylko dla członków. Aukcje, wymiana, dyskusje. I kwestia które tytuły naprawdę krążą w obiegu.',
  },
  {
    id: 'towarzystwo_antykwaryczne',
    title: 'Towarzystwo antykwaryczne',
    category: 'AKADEMICKIE: ROZSZERZENIA',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'korzystanie_z_bibliotek', threshold: 50, weight: 2.0 },
      { type: 'skill', key: 'wycena', threshold: 50, weight: 2.0 },
      { type: 'skill', key: 'historia', threshold: 50, weight: 1.5 },
      { type: 'skill', key: 'archeologia', threshold: 40, weight: 1.5 },
    ],
    flavor: 'Stare rzeczy mają pamięć. Antykwariusze też.',
    placeholder: 'np. Towarzystwo miłośników antyków i rzadkich przedmiotów. Spotkania, aukcje, prywatne przeglądy zbiorów. Kilka eksponatów zmienia właścicieli bez publicznego śladu.',
  },
  {
    id: 'ogrod_botaniczny_towarzystwo',
    title: 'Ogród botaniczny / towarzystwo zielarskie',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Botanika', threshold: 40, weight: 2.5 },
      { type: 'skill', key: 'wiedza_o_naturze', threshold: 60, weight: 1.5 },
    ],
    flavor: 'Rośliny leczą, trują i przywołują. Często ta sama roślina.',
    placeholder: 'np. Towarzystwo botaniczne przy ogrodzie lub instytucie. Hodowla rzadkich gatunków, katalogi, ekspedycje. Zielarze ludowi i farmaceuci mają tu wspólne zainteresowania.',
  },
  {
    id: 'towarzystwo_zoologiczne',
    title: 'Towarzystwo zoologiczne / safari i hodowcy',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'nauka:Zoologia', threshold: 40, weight: 2.5 },
      { type: 'skill', key: 'tresura_zwierzat', threshold: 50, weight: 1.8 },
    ],
    flavor: 'Dzikie zwierzęta wiedzą o świecie rzeczy których nauka nie skatalogowała.',
    placeholder: 'np. Towarzystwo zoologiczne przy zoo lub muzeum przyrodniczym. Badania, ekspedycje, hodowla. Kolekcjonerzy egzotycznych zwierząt bywają tu gośćmi i zleceniodawcami.',
  },
  {
    id: 'krag_kryptologow',
    title: 'Krąg kryptologów / amatorzy szyfrów',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mikro',
    unlock: [
      { type: 'skill', key: 'nauka:Kryptografia', threshold: 40, weight: 2.5 },
      { type: 'attribute', key: 'INT', threshold: 75, weight: 1.8 },
    ],
    flavor: 'Każda wiadomość ma dwie warstwy. Większość ludzi czyta tylko pierwszą.',
    placeholder: 'np. Nieformalna grupa miłośników szyfrów i kodów. Rozwiązujecie historyczne szyfry, tworzycie własne. Kilku członków trafiło tu z wojska lub wywiadu. I nie mówią dlaczego odeszli.',
  },
  {
    id: 'krag_psychoanalityczny',
    title: 'Krąg psychoanalityczny / klub freudystów',
    category: 'NAUKOWE I BADAWCZE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'psychoanaliza', threshold: 40, weight: 2.5 },
      { type: 'skill', key: 'psychologia', threshold: 50, weight: 2.0 },
    ],
    flavor: 'Nieświadomość jest głębsza niż ktokolwiek chce zbadać.',
    placeholder: 'np. Nieformalne koło praktyków i entuzjastów psychoanalizy. Wykłady, studia przypadków, dyskusje o Freudzie i jego następcach. Kilku członków stosuje metody których Freud by nie podpisał.',
  },
  {
    id: 'izba_handlowa',
    title: 'Izba handlowa / stowarzyszenie finansowe',
    category: 'TOWARZYSKIE I PRESTIŻOWE',
    organization_size: 'Średnia',
    unlock: [
      { type: 'skill', key: 'ksiegowosc', threshold: 50, weight: 2.5 },
      { type: 'wealth', key: 'majetnosc', threshold: 40, weight: 1.5 },
    ],
    flavor: 'Pieniądze lubią towarzystwo innych pieniędzy.',
    placeholder: 'np. Lokalna izba handlowa lub stowarzyszenie kupieckie. Cotygodniowe spotkania, lobbing, kontrakty. Rozmowy przy kolacji więcej kosztują niż kolacja.',
  },
  {
    id: 'cyrk_tresura',
    title: 'Środowisko cyrku / tresury i hodowców',
    category: 'BOJOWE I FIZYCZNE',
    organization_size: 'Mała',
    unlock: [
      { type: 'skill', key: 'tresura_zwierzat', threshold: 50, weight: 2.5 },
      { type: 'skill', key: 'jezdziectwo', threshold: 50, weight: 1.8 },
    ],
    flavor: 'Cyrk przyjmuje każdego i pamięta wszystkich których przyjął.',
    placeholder: 'np. Trupa cyrkowa lub środowisko tresurystów i hodowców egzotycznych zwierząt. Trasy po Stanach, kontakty w każdym mieście, lojalność która zastępuje rodzinę.',
  },
]

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const ADDITIONAL_POSITIONS: AdditionalPositionOption[] = [
  ...BOJOWE_I_FIZYCZNE,
  ...INTELEKTUALNE_I_AKADEMICKIE,
  ...NAUKOWE_I_BADAWCZE,
  ...ARTYSTYCZNE_I_KULTURALNE,
  ...TOWARZYSKIE_I_PRESTIZOWE,
  ...OKULTYSTYCZNE_I_TAJEMNICZE,
  ...RELIGIJNE_I_DUCHOWE,
  ...POLITYCZNE_I_SPOLECZNE,
  ...MARGINES_I_POLSWIATEK,
  ...EKSPLORATORZY_I_PRZYGODNICY,
  ...SPECJALNE_CECHY_80,
  ...ROZSZERZENIA,
]
