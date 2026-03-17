export interface BackstoryOption {
  roll: number
  text: string
}

export interface BackstoryTable {
  id: string
  label: string
  description: string
  options: BackstoryOption[]
}

export const BACKSTORY_TABLES: BackstoryTable[] = [
  {
    id: 'ideology',
    label: 'Ideologia / Przekonania',
    description: 'Co kieruje twoim Badaczem? W co wierzy?',
    options: [
      { roll: 1, text: 'Istnieje siła wyższa, którą czcisz i do której się modlisz (np. Wisznu, Jezus Chrystus, Hajle Syllasje I).' },
      { roll: 2, text: 'Ludzkość świetnie sobie radzi bez religii (np. zagorzały ateista, humanista, bezwyznaniowiec).' },
      { roll: 3, text: 'Nauka ma wszystkie odpowiedzi. Wybierz swój przedmiot zainteresowania (np. ewolucja, kriogenika, eksploracja kosmosu).' },
      { roll: 4, text: 'Wiara w przeznaczenie (np. karma, system klasowy, przesądność).' },
      { roll: 5, text: 'Członek stowarzyszenia lub tajnej organizacji (np. Wolnomularzy, Instytutu Kobiet, Anonymous).' },
      { roll: 6, text: 'W społeczeństwie jest zło, które musi zostać wykorzenione. Czym jest to zło? (np. narkotyki, przemoc, rasizm).' },
      { roll: 7, text: 'Okultyzm (np. astrologia, spirytyzm, tarot).' },
      { roll: 8, text: 'Polityka (np. konserwatyzm, socjalizm, liberalizm).' },
      { roll: 9, text: '„Pieniądze to władza i zamierzam mieć ich tyle, ile tylko zdołam zdobyć" (np. chciwy, przedsiębiorczy, bezwzględny).' },
      { roll: 10, text: 'Działacz/Aktywista (np. feminizm, prawa homoseksualistów, związki zawodowe).' },
    ],
  },
  {
    id: 'significant_people_who',
    label: 'Ważne osoby:Kto?',
    description: 'Kto jest najważniejszą osobą w życiu twojego Badacza?',
    options: [
      { roll: 1, text: 'Rodzic (np. matka, ojciec, macocha).' },
      { roll: 2, text: 'Babcia lub dziadek (od strony ojca lub matki).' },
      { roll: 3, text: 'Rodzeństwo (np. brat, przyrodnia siostra lub przybrana siostra).' },
      { roll: 4, text: 'Dziecko (syn lub córka).' },
      { roll: 5, text: 'Partner (np. małżonek, narzeczony, kochanka).' },
      { roll: 6, text: 'Osoba, która nauczyła cię zawodowej umiejętności o najwyższej wartości. Zidentyfikuj umiejętność i zastanów się, kto mógł cię jej nauczyć (np. nauczyciel; osoba, u której odbywałeś praktykę; twój ojciec).' },
      { roll: 7, text: 'Przyjaciel z dzieciństwa (np. kolega z klasy, sąsiad, wyimaginowany przyjaciel).' },
      { roll: 8, text: 'Sławna osoba. Twój idol lub bohater. Być może nigdy się nie spotkaliście (np. gwiazda filmowa, polityk, muzyk).' },
      { roll: 9, text: 'Inny Badacz w grze. Wybierz lub wylosuj jedną osobę z drużyny.' },
      { roll: 10, text: 'Bohater niezależny w grze. Poproś Strażnika Tajemnic, aby kogoś dla ciebie wybrał.' },
    ],
  },
  {
    id: 'significant_people_why',
    label: 'Ważne osoby:Dlaczego?',
    description: 'Dlaczego ta osoba jest dla ciebie ważna?',
    options: [
      { roll: 1, text: 'Masz dług u tej osoby. W jaki sposób ci pomogła? (np. finansowo, ochraniała cię w trudnych czasach, dzięki niej dostałeś pierwszą pracę).' },
      { roll: 2, text: 'Dana osoba czegoś cię nauczyła. Czego? (np. umiejętności, miłości, tego, jak być mężczyzną).' },
      { roll: 3, text: 'Dana osoba nadała znaczenie twojemu życiu. W jaki sposób? (np. pragniesz być taki jak ona, chcesz z nią być, chcesz uczynić ją szczęśliwą).' },
      { roll: 4, text: 'Skrzywdziłeś tę osobę i chcesz jej zadośćuczynić. Co zrobiłeś? (np. ukradłeś jej pieniądze, doniosłeś na nią, odmówiłeś pomocy).' },
      { roll: 5, text: 'Macie wspólne doświadczenia. Jakie? (np. mieszkaliście wspólnie w ciężkich czasach, dorastaliście razem, służyliście razem w wojsku).' },
      { roll: 6, text: 'Chcesz udowodnić tej osobie swoją wartość. Jak? (np. przez dostanie dobrej pracy, znalezienie odpowiedniego małżonka, zdobycie wykształcenia).' },
      { roll: 7, text: 'Ubóstwiasz tę osobę (np. za jej sławę, za jej piękno, za jej pracę).' },
      { roll: 8, text: 'Dręczy cię poczucie żalu (np. powinieneś był umrzeć zamiast niej, pokłóciliście się, nie pomogłeś jej, gdy miałeś okazję).' },
      { roll: 9, text: 'Chcesz udowodnić, że jesteś lepszy od tej osoby. Jaka była jej wada? (np. lenistwo, alkoholizm, oziębłość).' },
      { roll: 10, text: 'Dana osoba cię zdradziła i chcesz się zemścić. O co ją obwiniasz? (np. śmierć ukochanej osoby, twoją złą sytuację finansową, kryzys w małżeństwie).' },
    ],
  },
  {
    id: 'meaningful_locations',
    label: 'Znaczące miejsca',
    description: 'Jakie miejsce jest dla ciebie najważniejsze?',
    options: [
      { roll: 1, text: 'Miejsce, gdzie pobierałeś nauki (np. szkoła, uniwersytet, praktyka zawodowa).' },
      { roll: 2, text: 'Twoje miejsce pochodzenia (np. rolnicza wioska, miasteczko handlowe, ruchliwe miasto).' },
      { roll: 3, text: 'Miejsce, gdzie spotkałeś swoją pierwszą miłość (np. na koncercie, podczas wakacji, w schronie bombowym).' },
      { roll: 4, text: 'Miejsce cichej kontemplacji (np. biblioteka, twoja posiadłość, gdzie możesz spacerować na łonie natury, miejsce, gdzie wędkujesz).' },
      { roll: 5, text: 'Miejsce, gdzie udzielasz się towarzysko (np. klub dżentelmena, miejscowy bar, dom twojego wuja).' },
      { roll: 6, text: 'Miejsce związane z twoją wiarą/ideologią (np. kościół parafialny, Mekka, Stonehenge).' },
      { roll: 7, text: 'Grób ważnej dla ciebie osoby. Czyj? (np. rodzica, dziecka, kochanka).' },
      { roll: 8, text: 'Twój dom rodzinny (np. wiejska rezydencja, wynajęte mieszkanie, sierociniec, w którym cię wychowano).' },
      { roll: 9, text: 'Miejsce, gdzie przeżyłeś najszczęśliwsze chwile swojego życia (np. ławka w parku, twój uniwersytet, dom twojej babci).' },
      { roll: 10, text: 'Twoje miejsce pracy (np. biuro, biblioteka, bank).' },
    ],
  },
  {
    id: 'treasured_possessions',
    label: 'Rzeczy osobiste',
    description: 'Jaka rzecz jest dla ciebie najcenniejsza?',
    options: [
      { roll: 1, text: 'Przedmiot związany z twoją umiejętnością o najwyższej wartości (np. drogi garnitur, fałszywe dokumenty, kastet).' },
      { roll: 2, text: 'Przedmiot ważny dla twojego zawodu (np. torba lekarska, samochód, wytrychy).' },
      { roll: 3, text: 'Pamiątka z dzieciństwa (np. komiks, scyzoryk, szczęśliwa moneta).' },
      { roll: 4, text: 'Pamiątka po zmarłej osobie (np. biżuteria, fotografia w portfelu, list).' },
      { roll: 5, text: 'Coś otrzymanego od ważnej osoby (np. pierścionek, dziennik, mapa).' },
      { roll: 6, text: 'Twoja kolekcja. Co zbierasz? (np. bilety autobusowe, wypchane zwierzęta, płyty z nagraniami).' },
      { roll: 7, text: 'Coś, co znalazłeś, ale nie wiesz, czym tak naprawdę jest:szukasz odpowiedzi (np. list w nieznanym języku, ciekawa fajka o niewiadomym pochodzeniu, dziwna srebrna kula wykopana w ogrodzie).' },
      { roll: 8, text: 'Przedmiot związany ze sportem (np. kij krykietowy, podpisana piłka baseballowa, wędka).' },
      { roll: 9, text: 'Broń (np. ślubowy rewolwer, twoja stara strzelba do polowań, nóż ukryty w cholewce buta).' },
      { roll: 10, text: 'Domowe zwierzątko (np. pies, kot, żółw).' },
    ],
  },
  {
    id: 'traits',
    label: 'Przymioty',
    description: 'Jaki jest twój najważniejszy przymiot?',
    options: [
      { roll: 1, text: 'Szczodry (np. dajesz duże napiwki, zawsze pomagasz ludziom w potrzebie, jesteś filantropem).' },
      { roll: 2, text: 'Dobrze sobie radzisz ze zwierzętami (np. kochasz koty, dorastałeś na farmie, dobrze sobie radzisz z końmi).' },
      { roll: 3, text: 'Marzyciel (np. ulegasz wybrkom fantazji, jesteś wizjonerem, jesteś bardzo kreatywny).' },
      { roll: 4, text: 'Hedonista (np. imprezowa dusza towarzystwa, rozrywkowy kolega od kieliszka, wyznawca zasady „żyj szybko, umieraj młodo").' },
      { roll: 5, text: 'Hazardzista i ryzykant (np. twarz pokerzysty, uważasz, że wszystkiego w życiu trzeba choć raz spróbować, żyjesz na krawędzi).' },
      { roll: 6, text: 'Dobry kucharz (np. pieczesz świetne ciasta, potrafisz stworzyć posiłek prawie z niczego, masz wyrafinowane podniebienie).' },
      { roll: 7, text: 'Bawidamek/Uwodzicielka (np. jesteś gładki w obyciu, masz czarujący głos, magnetyczne spojrzenie).' },
      { roll: 8, text: 'Lojalny (np. zawsze wspierasz swoich przyjaciół, nigdy nie złamałbyś danej obietnicy, jesteś skłonny umrzeć za swoje przekonania).' },
      { roll: 9, text: 'Dobra reputacja (np. najlepszy oficjalny mówca, najbardziej pobożny człowiek, nieustraszony w obliczu niebezpieczeństwa).' },
      { roll: 10, text: 'Ambitny (np. chcesz osiągnąć cel, chcesz zostać szefem, chcesz mieć wszystko).' },
    ],
  },
]

export const APPEARANCE_ADJECTIVES = [
  'Wyrazisty', 'Przystojny', 'Niezgrabny', 'Śliczny', 'Czarujący',
  'O dziecinnej twarzy', 'Bystry', 'Zaniedbany', 'Nijaki', 'Brudny',
  'Olśniewający', 'Mól książkowy', 'Młodziutki', 'Znużony', 'Pulchny',
  'Tęgi', 'Owłosiony', 'Szczupły', 'Elegancki', 'Niechlujny', 'Krępy',
  'Blady', 'Posępny', 'Przeciętny', 'Rumiany', 'Opalony', 'Pomarszczony',
  'Wyniosły', 'Nieśmiały', 'Ostre rysy', 'Krzepki', 'Filigranowy',
  'Muskularny', 'Postawny', 'Niezdarny', 'Słabowity',
]
