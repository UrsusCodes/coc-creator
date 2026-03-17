/**
 * Black Market Catalog — Illegal items available through underworld contacts
 * Era: Klasyczna (lata 20. XX wieku)
 */

export interface BlackMarketItem {
  id: string
  name: string
  priceMin: number
  priceMax: number
  description: string
  tag: string
}

export const BLACK_MARKET_CATALOG: BlackMarketItem[] = [
  {
    id: 'nielegalny_rewolwer',
    name: 'Nielegalny rewolwer',
    priceMin: 30,
    priceMax: 60,
    description: 'Rewolwer bez numeru seryjnego, nieśledzony. Kaliber zależy od dostępności.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'tlumik',
    name: 'Tłumik',
    priceMin: 50,
    priceMax: 100,
    description: 'Tłumik do pistoletu. Redukuje dźwięk strzału, ale wpływa na celność na dłuższych dystansach.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'thompson_smg',
    name: 'Thompson (pistolet maszynowy)',
    priceMin: 200,
    priceMax: 400,
    description: 'Pistolet maszynowy Thompson kal. .45. Potocznie „Tommy Gun". Nielegalny bez pozwolenia.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'granat_reczny',
    name: 'Granat ręczny',
    priceMin: 20,
    priceMax: 50,
    description: 'Granat odłamkowy z okresu Wielkiej Wojny. Obrażenia: 4K6 w promieniu 3 m.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'granat_dymny',
    name: 'Granat dymny',
    priceMin: 10,
    priceMax: 25,
    description: 'Granat dymny — tworzy gęstą zasłonę w promieniu 5 m na kilka minut.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'dynamit_laseczka',
    name: 'Dynamit (laseczka)',
    priceMin: 5,
    priceMax: 15,
    description: 'Pojedyncza laseczka dynamitu. Obrażenia: 3K6 w promieniu 2 m.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'amunicja_ap',
    name: 'Amunicja przeciwpancerna (AP)',
    priceMin: 10,
    priceMax: 30,
    description: 'Amunicja przebijająca (20 szt.). Połowa wartości pancerza celu.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'narkotyki_kokaina',
    name: 'Kokaina (dawka)',
    priceMin: 5,
    priceMax: 15,
    description: 'Kokaina w proszku. Efekt: chwilowa euforia i odporność na ból. Uzależniająca.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'narkotyki_heroina',
    name: 'Heroina (dawka)',
    priceMin: 5,
    priceMax: 20,
    description: 'Heroina. Silnie uzależniająca. Efekt: otępienie i zniesienie bólu.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'narkotyki_opium',
    name: 'Opium (dawka)',
    priceMin: 3,
    priceMax: 10,
    description: 'Opium do palenia lub jedzenia. Efekt: halucynacje, senność, uzależnienie.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'narkotyki_marihuana',
    name: 'Marihuana (porcja)',
    priceMin: 1,
    priceMax: 5,
    description: 'Marihuana do palenia. Efekt: relaksacja, spowolnienie.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'alkohol_przemycany',
    name: 'Alkohol (przemycany)',
    priceMin: 3,
    priceMax: 15,
    description: 'Butelka przemycanego alkoholu — whiskey, gin lub bimber. Era prohibicji.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'falszywe_dokumenty',
    name: 'Fałszywe dokumenty tożsamości',
    priceMin: 50,
    priceMax: 200,
    description: 'Fałszywy paszport, prawo jazdy lub inne dokumenty. Jakość zależy od ceny.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'falszywe_pozwolenie_bron',
    name: 'Fałszywe pozwolenie na broń',
    priceMin: 25,
    priceMax: 100,
    description: 'Podrobione pozwolenie na broń palną.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'informacje',
    name: 'Informacje (od informatora)',
    priceMin: 5,
    priceMax: 100,
    description: 'Informacje od informatora ze świata przestępczego. Cena zależy od wartości informacji.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'trucizna',
    name: 'Trucizna',
    priceMin: 10,
    priceMax: 50,
    description: 'Trucizna (arszenik, cyjanek itp.). Dyskretna i trudna do wykrycia.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'kamizelka_kuloodporna',
    name: 'Kamizelka kuloodporna',
    priceMin: 50,
    priceMax: 150,
    description: 'Prymitywna kamizelka kuloodporna. Pancerz 3 punkty, ukryta pod ubraniem.',
    tag: '[Czarny rynek]',
  },
]
