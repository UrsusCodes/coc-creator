---
date: 2026-07-29
status: draft
tags:
  - spec
  - feature/drive
  - feature/pillars
  - feature/sources-of-stability
  - feature/companions
  - feature/contacts
  - feature/wealth
  - feature/development
  - decision
---

# Campaign Layer — Zew, Filary, Źródła, Rozwój, Majętność, Towarzysze, Kontakty

> [!note] Language
> This document is in English per vault convention. **Polish mechanic names are canonical** — they are the player-facing terms and must not be translated in UI, cards, or website copy. English glosses are provided in parentheses on first use.

## Problem

The app implements character *creation* very well and campaign *continuation* not at all. Every system with mechanical depth is spent at the moment of character generation and then becomes decoration on the card:

- **Filary poczytalności / Źródła stabilności / Motywacja** were ported from Trail of Cthulhu as data structures without the economy that makes them work there. In ToC they plug into **Stability**, a renewable pool separate from long-term Sanity: obeying a Drive refreshes +2 Stability, refusing costs −4; a shattered Pillar costs 6 Stability + 2 Sanity; visiting a Source between adventures refreshes +3 Stability. CoC 7e has no Stability, so the ported nouns had no verbs. Result: pure character description.
- **Kontakty** (50+ subcategories, strength × 30 roll value) were unusable in play — an abstract category forces the Keeper to invent an NPC on demand mid-scene, and "I know someone in law enforcement" has no natural bounds.
- **Wygląd (APP)** is the classic dump stat. Verified: it feeds **no derived attribute** (HP = CON+SIZ, MP = POW, damage bonus = STR+SIZ, Dodge = DEX, Sanity = POW), so it can be repurposed without touching any other formula.
- **Wealth v2** (6 tiers, gap cost, daily expenses, lifestyle stars) has no drain and no refill — it is computed once and displayed forever.
- **Skill development** has a dead zone at both ends: low skills rarely earn checks (they rarely succeed), high skills rarely convert them (the improvement roll needs a d100 above current value). Only the 40–60 band actually grows. There is also **no way to learn deliberately** — RAW only improves what you already used successfully.
- **Downtime / development rules** are the only never-started item on the original roadmap. This is not a coincidence: "unused" and "missing" are two sides of the same gap.

Additional table-level pains reported by the Keeper:

- No room in a session for a quiet one-on-one scene with a single player's NPC.
- A globetrotting campaign cuts investigators off from their home-town anchors entirely.
- Players either can afford everything or must scrape; in practice the rich player pays for everyone and money never bites.
- Skill-check tracking during play is forgotten because the check happens mid-scene and pays off much later.

## Scope

**In scope** — nine interlocking systems, all campaign-layer:

1. **Zew** (Drive) — why the character walks into the dark.
2. **Filary poczytalności** (Pillars of Sanity) — shields against madness *states*.
3. **Źródła stabilności** (Sources of Stability) — small recurring Sanity recovery.
4. **Rozwój** (Development) — skill and characteristic growth.
5. **Nagrody końcowe** (End-of-scenario rewards) — unified reward economy.
6. **Towarzysze** (Companions) — one following NPC per player.
7. **Majętność + Szacunek** (Wealth + Standing) — split economy.
8. **Wygląd jako sieć społeczna** (Appearance as social network).
9. **Kontakty** (Contacts) — rebuilt as named people with named favors.

**Out of scope for this document:** in-session mechanics (combat, chases, magic), the price-dictionary tooling (see [[#Parked — price dictionary]]), implementation sequencing in the app (to be designed next — see [[#Open questions]]).

## Cross-cutting design principles

These emerged during design and should govern any future extension. They are the reason the nine systems feel like one system.

| Principle | Where it applies |
|---|---|
| **Roll above your current value to grow** | skill improvement rolls; the end-of-scenario SAN/Luck gate. One mechanism, learned once. |
| **Three-state vocabulary** | filary (`cały → nadwyrężony → zniszczony`), kontakty (`świeża → nadwyrężona → spalona`). Same shape, same intuition. |
| **Category carries mechanics, detail text carries colour** | Zew (4 categories + free-text rozwinięcie), Wygląd (how it manifests), towarzysz (role + name). |
| **Renewable, not closable** | every player-written detail must be able to fire across a whole campaign. "One missing person" is a dead hook; "people vanish in circumstances nobody wants to investigate" is a live one. |
| **Perceptual tests, not arithmetic** | "did someone at the table say *don't do it*?" (Zew, występek), "did you live beyond your means?" (Majętność). No counting. |
| **Limit by budget, not by veto** | a veto produces arguments; a per-session cap produces none. |
| **Hide formulas, reveal affordances** | thresholds, equilibria and exact dice stay behind the screen. Players **must** know that they can flag a Zew moment, that źródła restore Sanity, and that filary protect them — a reward nobody knows about motivates nobody. Companion mechanics are the best candidate for full concealment. |
| **One downtime budget, many claimants** | study, pillar repair, source scenes, contact repair, socialising and detox all compete for the same 2 actions. This is what makes downtime a decision instead of a checklist. |
| **Two rhythms** | *per session*: skill checks, improvement rolls, Zew, źródła. *Per scenario*: end-of-scenario rewards, downtime, POW conversion, Majętność roll. Worth stating explicitly in the rules — players will ask. |

---

## 1. Zew (Drive)

Replaces the 14 imported ToC Drives with **four categories** organised by *direction of pull*. The old 14 had three structural faults: four of them (Ciekawość, Głód wiedzy, Wiedza akademicka, Antykwarianizm) were mechanically the same drive; three (Pech, Nagły wstrząs, To we krwi) were origin stories containing no choice and therefore no possible trigger; and none covered plain material greed or guilt/atonement.

Thematic framing: **źródła pull the character back toward humanity, the Zew pushes them into the abyss.** The Zew therefore must never pay in Sanity — that is the domain of źródła.

### Categories

| Zew | Direction | Player's sentence | Detail-field flavours |
|---|---|---|---|
| **Nienasycenie** | toward the thing | "I cannot bear not having seen it / not having it" | wiedza tajemna · artefakty · majątek · czyste doznanie · piękno |
| **Zobowiązanie** | toward a person | "Someone is counting on me / I owe this" | opieka · dane słowo · wina i odkupienie · wierność komuś |
| **Duma** | toward the self | "They will see who I am" | duma · zniewaga do pomszczenia · potrzeba uznania |
| **Piętno** | away from the past | "There is nowhere to go back to" | świat zamknął drzwi (pech, krew, wstrząs) · sam je zamknąłeś (ucieczka) |

Notes on naming: **Nienasycenie** (not *Głód*) because it names a *state* of never-enough, which is what the merged category needs — hunger implies appetite for one specific thing. **Duma** chosen over *Honor* and *Ego* for readability; consequence is that revenge can sit under either Duma (wounded pride) or Zobowiązanie (a debt to the dead), and the detail field decides which. *Ego* was rejected as the only term in the set from a psychoanalyst's office.

### Rozwinięcia (elaborations)

Every player writes one, or picks from the list. **Hard rule: it must be renewable, not closable.** A single quest resolves and kills the Zew; a standing disposition fires for the whole campaign.

**Nienasycenie**
1. Każda zapieczętowana skrzynia i zamknięte drzwi muszą zostać otwarte — nie potrafię przejść obojętnie.
2. Zbieram to, czego nikt inny nie ma. Kolekcja jest niepełna i zawsze będzie.
3. Raz zobaczyłem coś, czego nie da się opisać. Od tamtej pory wszystko inne jest blade.
4. Pieniądze nie są celem, tylko dowodem, że sięgnąłem po to, czego inni się bali.
5. Czytam wszystko, co wpadnie mi w ręce — a są księgi, których czytać nie wolno, i właśnie te chcę.
6. Nudzę się śmiertelnie wszędzie tam, gdzie nic mi nie grozi.

**Zobowiązanie**
1. Ktoś kiedyś nadstawił za mnie karku i zapłacił za to. Spłacam ten dług każdemu, kto trafia w podobne kłopoty.
2. Ludzie znikają w okolicznościach, których nikt nie chce badać. Ja badam.
3. Przeżyłem, a inni nie. Muszę zapracować na to, że to ja tu zostałem.
4. Złożyłem przysięgę — zakonną, lekarską, wojskową — i traktuję ją poważniej, niż wypada.
5. Idę tam, gdzie idzie ta jedna osoba. Nie umiem zostawić jej samej.
6. Zawdzięczam komuś wszystko i wciąż jestem proszony o przysługi, których nie wypada odmówić.

**Duma**
1. Dokonam odkryć, które wstrząsną światem — ich nazwiska zapomną, moje nie.
2. Wyśmiali mnie na katedrze i w gazetach. Dowód trzeba przynosić wciąż od nowa.
3. Raz zawiodłem kogoś, kto był pod moją opieką. Nikt więcej pod moją opieką nie ucierpi.
4. Nie ma zamka, którego bym nie otworzył, i nie zniosę myśli, że gdzieś taki istnieje.
5. Nazwisko mojej rodziny coś znaczyło. Przywrócę mu blask albo zginę, próbując.
6. Jestem najlepszy w tym, co robię — a to trzeba udowadniać co miesiąc od nowa.

**Piętno**
1. Uciekłem z rodziny o złej sławie, ale dziwne zdarzenia mnie nie opuszczają.
2. Byłem tam, kiedy to się stało. Nikt mi nie uwierzył — a od tamtej pory rozpoznaję te same ślady wszędzie.
3. Wszyscy wokół mnie umierają dziwną śmiercią. Muszę wiedzieć, czy to przeze mnie.
4. Zostawiłem w domu coś, do czego nie mogę wrócić: żonę, dług, grób, wyrok.
5. Śnię to samo od dziecka i coraz częściej rozpoznaję te miejsca na jawie.
6. Wojna zdarła mi zasłonę z oczu i nie potrafię jej z powrotem założyć.

> [!note] Zobowiązanie #5
> This is the old ToC "Follower" and it ties directly into źródła slot 3 — the same person can be both the anchor that keeps you sane and the reason you go down into the tunnel.

### Trigger

> **Zew fires when you do something with real risk, or something that strongly pushes the matter forward — something the rest of the party would not have done.** The player marks it; the Keeper may also point out that the Zew is stirring. **Once per session.**

The comparative clause ("something the others would not have done") does the load-bearing work: it is **self-normalising**. It cannot be satisfied by "we all followed the lead, so we all qualify" — something must have singled out *this* character. It is also cheap to adjudicate and requires no Keeper prep.

Optional Keeper tool (not required): if a player's Zew has not fired by late in the session, plant an opportunity. With four broad categories, **one prepared scene element serves the whole table** — a sealed archive under a church offers Nienasycenie (what is behind the door), Zobowiązanie (without what is inside you cannot save her), Duma (the priest told you to your face you have no business here) and Piętno (the sign on the door is the same one). One element, four hooks, no per-player prep. Used deliberately, this also produces the individual spotlight scenes the Keeper reported missing.

### Reward — menu of three, one per session

| Reward | Effect | Horizon |
|---|---|---|
| **Naprawa filaru** | one `nadwyrężony` pillar returns to `cały` | immediate survival |
| **Szczęście** | +3 to maximum **and** +3 current (cap 99) — see open question below | medium-term buffer |
| **Rozwój** | one development check on a skill of choice, with justification | long character arc |

The "one per session" constraint is the entire balance mechanism — opportunity cost self-regulates without tables or caps. A player who always takes Szczęście never repairs pillars and never grows.

Design rationale for **naprawa filaru** being the strongest option: risk and reward are denominated in the same currency. The Zew threatens madness and pays in a shield against madness, so it never feels like trading a life for loose change. Thematically it states something worth stating outright: **there are two roads to keeping your mind — love and obsession.** Źródła and normalność repair pillars through connection; the Zew repairs them because the character confirmed to themselves who they are.

Constraints:

- The **Rozwój** check is granted **above** the 3-per-session limit, not instead of one.
- The skill must relate to what the character did in the Zew scene, or did about it afterwards. Otherwise it degenerates into raising Firearms every session regardless of fiction.

### Anti-bait provisions

If a character dies or goes mad following the Zew, the mechanic reads as bait and, over a long campaign, players stop biting. Accepted mitigations:

- **The Zew pulls toward exposure, not suicide.** Keeper filter: if the only way to act on the Zew is an action that can kill outright, it is not a Zew moment. The Zew says *stay, look, go deeper, take it with you* — it produces Sanity loss, complications, lost time and being noticed, not survival rolls.
- **Dziedzictwo (legacy).** Death or madness while following the Zew leaves something behind: the dziennik passes on, and the next character starts with something the last one earned — a lead, an object, a contact, an entry that changes the scenario. The price buys something that stays at the table.
- **No refusal tax.** ToC charges 4 Stability for refusing a Hard Driver; this is the single most criticised element of that system ("charged for not doing what the Keeper thinks your character should do"). Not ported. Refusal simply earns nothing.

### Data model

`drive` (enum of 4) + `drive_detail` (text). **Both fields already exist** in `src/types/character.ts` and `src/data/drivePillars.ts`. The change is replacing the 14-entry `DRIVES` array with 4 entries plus a flavour-hint list — no schema change, no migration.

---

## 2. Filary poczytalności (Pillars of Sanity)

The ToC original is a Keeper-facing punishment (a revelation shatters your pillar, costing 6 Stability + 2 Sanity). Inverted here into a **player-facing shield against madness states** — which is what players actually fear: not a number on the sheet, but losing control of their character.

- **3 pillars per character, flat** (no scaling from SAN — simpler and fairer than the ToC 1-per-3-Sanity rule).
- States: **cały → nadwyrężony → zniszczony**.
- **Blocking temporary insanity** costs the *nadwyrężenie* of one `cały` pillar. The player chooses which and narrates how the belief still holds ("God has not abandoned me… not yet").
- **Blocking indefinite insanity** costs the *destruction* of one `cały` pillar. A `nadwyrężony` one will not do — you cannot lean your whole weight on a cracked belief. Sanity still drops; the character stays with the player.
- **No `cały` pillars left** → no protection, RAW applies. **All three destroyed** → penalty die on Sanity rolls ("there is nothing left to hold on to"). This mirrors ToC's permanent +1 difficulty for a pillar-less investigator.
- The Keeper **may** shatter a pillar directly with a major revelation that contradicts it head-on. Rare, and it crumbles without granting any protection. Optional — the system works without it.
- **Repair:** a downtime scene with a źródło stabilności, or the Zew reward. Two faucets, two very different prices.

Existing `pillars?: string[]` field carries the text; state needs one extra field (see [[#Open questions]]).

---

## 3. Źródła stabilności (Sources of Stability)

Five slots. Slots 1–2 are universal infrastructure, slot 3 is relational, slots 4–5 are individual identity.

| Slot | Content |
|---|---|
| **1 — Ostoja** | one **shared** safe place for the whole party |
| **2 — Dziennik** | always; every character keeps one |
| **3 — Relacja** | towarzysz (companion NPC, earned in play) **or** another player's character **or** a kontakt (max one) |
| **4** | one of {Powołanie, Przedmiot, Nałóg} |
| **5** | one of {Powołanie, Przedmiot, Nałóg} — must differ from slot 4 |

### The grammar every source type must satisfy

1. **Trigger: meaningful use under pressure — never in comfort.** A lighter used on a stick of dynamite to blow open the exit from a trap, yes; used to light a cigarette, no.
2. **Reward:** a small Sanity recovery (see open question on calibration).
3. **Limit:** once per session per source.
4. **Risk written into the type** — a source must be able to break, betray, or turn.
5. **Availability ↔ fragility axis:** the more often a source is at hand, the more often it is also within reach of the plot, i.e. in danger. Rarely-available sources are safer but pay out less often.

### Types

**Ostoja** (slot 1) — one concrete, currently-declared safe place: an apartment, a hotel room, a ship's cabin, a specific church. Not a *type* of place. **Shared by the party**: simpler, natural in a globetrotting campaign (establishing a base in each new city is itself a good scene), and its desecration hits everyone, which makes defending it a common interest. Because the players choose where to put down roots, a violated Ostoja costs Sanity with a penalty die and no pillar protection — hence the care needed when declaring a mere hotel room.

**Dziennik** (slot 2) — trigger: actually writing an entry (2–3 real sentences) after significant events. Three layers of value: meta (other players may read it), diegetic (enemies can steal it, investigators can find it), and successional (material for a new character after death — see Zew dziedzictwo). Strong candidate for an in-app feature.

**Relacja** (slot 3) — three options:
- *Another player's character.* Rule that prevents negotiated pairs: **in a session you may support only one other character, and if you do, you may not receive support yourself.** This creates a small graph of care each session and makes support an actual sacrifice. With an odd number of players someone is always left out — free drama. If the supporting character is broken, absent or in crisis themselves, the source does not work; their death or madness is an automatic major blow with no right to spend a pillar (that was your prop).
- *Towarzysz* — a companion NPC, must be earned in play (see [[#6 Towarzysze Companions]]).
- *Kontakt* — allowed **immediately at character creation**, max one. The earlier "NPC must have had at least one played scene" gate is void: it existed to prevent writing letters to a drawer, i.e. naming an invented NPC. The kontakt format (name, institution, defined favour) already provides that guarantee, so the gate has nothing left to protect.

**Powołanie** (slots 4–5) — a mission archetype, rewarded for *achieved success in its domain*, not for a successful skill roll (many occupations have no obvious signature skill). Draft archetypes: **Ratownik · Stróż porządku · Artysta · Zdobywca majątku · Odkrywca prawdy · Obrońca słabszych · Pionier · Mistrz rzemiosła.** In-party conflicts (Zdobywca majątku vs Stróż porządku) are a feature.

**Przedmiot** (slots 4–5) — the availability/fragility axis in its purest form. An object used meaningfully in a scene is *exposed* in that scene, but only occasionally — the Keeper's right to threaten it exists as an anti-spam brake, not as an automatic consequence.

**Nałóg** (slots 4–5) — gambling, drink, drugs. **No addiction-escalation track.** The single condition: the indulgence happens in a situation that, **in the players' eyes**, carried risk or cost — even if the objective risk was small. A perceptual test, consistent with the Zew trigger.

### Types considered and rejected

- **Rytuał / rutyna** and **kolekcja / łamigłówki** — checkbox with no dramatic value, too easily available; kolekcja duplicates rutyna.
- **Ekspresja twórcza** — folded into Dziennik, which carries the same idea with better hooks.
- **Typ miejsca** (any library, any chapel) — replaced by the concrete Ostoja: a type of place is either trivially available or nearly impossible.
- **Korespondencja** as a standalone type — demoted to a *maintenance channel* for an established NPC at a distance, not a source in its own right.

### Normalność (the downtime container)

Not a source type — the **scene, break, or dedicated "holiday from horror" session** in which sources are actually played, pillars repaired, contacts patched up, and characters live ordinary lives. This closes the architecture:

> **źródła (ongoing small recovery) → filary (shields) → normalność (repair)**

---

## 4. Rozwój (Development)

### Checks

- **3 checks per session per character, one shared pool**, any mix of successes and meaningful failures.
- **Single pool, not separate quotas.** Separate quotas for successes and failures create a behavioural fault: a player with an unused failure slot goes looking for somewhere to fail dramatically. A shared pool never does that.
- A **failure** counts only if it **cost something** — the matter got complicated, someone got hurt, a lead was lost. "Didn't make it, moving on" does not count.
- **Checks are declared at the end of the session**, not marked mid-scene. The mid-scene tick is forgotten because the table's attention is elsewhere and no amount of discipline fixes that; players do reliably remember which moments mattered. The player names 2–3 skills with a one-sentence justification, the Keeper confirms. **Same ritual as the Zew reward — one end-of-session review covers both, and one screen in the app.**
- Scarcity is the point: at three, the player must choose which moments defined the session, and choice is where the satisfaction lives. At six, everything fits, nothing is chosen, and it is bookkeeping again.

### Growth table

| | Sukces | Porażka |
|---|---|---|
| **below 50%** | 2k6 | 1k6 |
| **50% and above** | 1k6 | 2k6 |

The inversion above 50% is deliberate and reflects how expertise is actually acquired: **a novice learns from success** (I did it right, I know how), **an expert learns from failure** (I touched the edge of my competence — the only place a master still grows).

Checked for abuse: above 50% failure pays more than success, but failure is not chosen, is rare (the better you are the rarer it gets), and is gated by the "it must have cost something" clause. Pleasant side effect — at high skill levels players will submit their humiliations rather than their triumphs, and the check list tells a story.

### Improvement roll

- Roll d100; **above** the current value = improve by the table above.
- **Carry-over:** a failed improvement roll **does not consume the check** — it stays until it converts. This repairs the upper dead zone: a 75% skill stops being "will never grow" and becomes "will grow in three or four scenarios". One line of rules, a large change in feel.
- Because one skill holds at most one pending check, the pool of 3 keeps the number of pending rolls small and no separate re-roll throttle is needed.

Campaign pace under this table: 20% → 50% takes roughly 7 sessions of consistently submitting that skill (the lower dead zone genuinely disappears); 60% → 90% roughly 20–25 sessions. The improvement roll's self-balancing property — the better you are, the slower you grow — is preserved, which is the main reason a full XP/point-buy overhaul was **rejected**: it loses that property and requires per-band price tables, inviting optimisation.

### Between-session learning (downtime actions)

RAW allows no deliberate learning at all. Four actions, all competing for the same downtime budget:

| Action | Effect |
|---|---|
| **Samonauka** | releases the throttle — allows more pending checks to be re-rolled this cycle |
| **Praktyka** | cheap, repetitive, no teacher: +1 point to a skill below 50%. Slow but certain climb out of the bottom |
| **Intensywna praca / przerzucanie punktów** | move points between skills at a **2:1 loss** (drop 10, gain 5), never below the donor skill's base value |
| **Mistrz** (trainer) | an NPC teacher, paid in money or a favour: **skips the improvement roll**, guaranteed gain. Opens the upper band — above 70% growth stops being a lottery and becomes something to arrange in the fiction |
| **Studia nad Mitami** | tomes, priced in Sanity and in max-Sanity. Already exists; just needs to join this rhythm |
| **Utrzymywanie znajomości** | dinners, correspondence, the club, the parish — maintains/raises Wygląd (see §8) |

**Point transfer** needs the 2:1 loss as its only guard. At par it is a min-maxing tool (dump Ride into Firearms); nobody optimises through a channel that eats half, so only players who genuinely want the fictional change use it.

### Downtime budget — decoupled from in-game time

**Each inter-scenario break grants 2 actions**, regardless of whether it lasted two weeks or six months. A very long break may grant a third; that is all.

Justification that sells this at the table without friction: skills do not grow from clock time but from intensity and stakes — and between scenarios the character has a life (work, family, obligations) that eats the rest of the time regardless of how much there was. Practising the violin eight hours a day for six months yields less than two weeks of real desperation.

The regulating mechanism is competition: **those 2 actions compete with pillar repair, source scenes, contact repair and detox.** A regime of study is not forbidden, merely expensive — whoever studies is not healing their head and not visiting their wife. Self-limiting.

### Characteristics

- **EDU** — grows naturally with age (already in the creation rules); downtime study may grant an EDU improvement roll.
- **POW** — grows only via the reward conversion (§5). Consequences are mild: it feeds MP, and under the house rule below, max Sanity.
- **STR / CON / DEX** — **not developed** (decision). They would move HP, damage bonus, Move and Dodge, i.e. the conversion tables the whole combat system stands on.
- **APP / SIZ / INT** — not touched (APP grows as a skill instead, see §8).

---

## 5. Nagrody końcowe (End-of-scenario rewards)

Unified on **k6** as the single die of the whole system (the development table already speaks k6).

### Size

- **1k6 per small goal**, **2k6 per big goal**, **3–4k6 for a rare milestone** (roughly once every 5–10 sessions).
- The Keeper writes 1–3 goals next to the scenario; the award is the sum of the achieved ones. Scaling handles itself (a bigger scenario has more goals), no discretionary judgement is needed, and the goals **may be visible to players during play** — the award stops being an after-the-fact surprise and becomes something to play for.

### The gate

Roll d100 against **current Sanity**:

- **Rolled above Sanity** (failed the Sanity test) → **full dice**.
- **Rolled at or under** → **each k6 counts as 1** (i.e. every die came up minimum).

This is the same "roll above your current value to grow" mechanism as the improvement roll — the system rewards you where you are weak, not where you are strong. Nobody leaves empty-handed, and the mnemonic needs no separate rule.

Effect size: a 3.5 : 1 ratio on the roll itself, which after probabilities works out to roughly **1.8×** difference in expected award between a character at SAN 30 and one at SAN 75.

> [!warning] Do not carry over a failed gate roll
> Carry-over is correct for skill checks and **wrong here** — it would erase the whole difference between SAN 34 and SAN 80, since everyone would eventually collect. This one mechanism deliberately works differently and the rules must say so, because players will ask.

### Equilibrium

The gate creates an attractor: above it the chance of reward falls below losses, below it the chance rises. Sanity drifts to that point and stays.

`equilibrium = 140 − 40 × (Sanity loss per scenario) / (number of k6)`

| k6 in the award | loss ≈5 | loss ≈8 | loss ≈12 |
|---|---|---|---|
| 2 | 40 | spiral down | spiral down |
| 3 | 73 | 33 | spiral down |
| 4 | 90 | **60** | 20 |
| 5 | ~100 | 76 | 44 |
| 6 | — | 87 | 60 |

A typical scenario (one big goal + one or two small = 3–4 dice) at moderate losses settles in the **33–60** band: characters permanently battered but functional, never restored to their starting state, and no death spiral. That is the correct register for CoC.

> [!note] Rule of thumb
> **The total dice in an award should not exceed the typical Sanity loss of the scenario.** The consolation floor is unconditional income, so a light scenario with many goals heals the whole party regardless of rolls.

### Luck as an alternative

The player may take Luck instead of Sanity. Luck burns far faster than Sanity (a single roll adjustment can cost 10–30 points, while 7 points of Sanity is a lot), so at parity nobody would ever choose it. Therefore: **Luck award = double the dice pool**, and the consolation floor doubles with it — no separate rule needed.

### Max Sanity and POW conversion

**House rule: max Sanity = POW − Cthulhu Mythos.**

> [!warning] Divergence from RAW
> As read by Claude, 7e caps Sanity at **99 − Cthulhu Mythos**, with POW setting only *starting* Sanity. The Keeper's reading is POW − Mythos and that governs at the table. Recorded here explicitly because the difference is large and should be a deliberate choice.

The Keeper's reading is the better fit and should be adopted knowingly: the character **starts exactly at their ceiling** (Mythos = 0, so ceiling = POW = starting Sanity) and from then on can only descend, since every point of Mythos lowers the cap. Markedly bleaker and truer to genre than a version where a POW 50 investigator has a theoretical path to 99. Crucially, it makes **raising POW the only lift upward anywhere in the system**, which is what justifies the conversion:

- When you would gain Sanity or Luck while **at maximum**, every full **5 wasted points → +1 POW** (and therefore +1 max Sanity).
- **Cap: +1 POW per scenario.** Needed because under the POW ceiling characters start at their cap, so the "at maximum" condition fires often, especially early. Without the brake the first few light scenarios become a pump.

Synergy worth noting: a character at ceiling typically sits near POW (~50), i.e. ~50% to pass the gate, so the POW pump fires roughly every other scenario on its own.

### Converting published scenarios

| In the module | Here |
|---|---|
| 1k3, 1k4, 1k6 | 1k6 |
| 1k8, 1k10, 2k6 | 2k6 |
| 2k10, 3k6, very large | 3k6 |

---

## 6. Towarzysze (Companions)

A wealthy player legitimately wanting his chauffeur to drive him is the origin case. The design must let wealth mean something without letting the player acquire a second character.

### Failure modes being designed against

- **Risk laundering** — "let the chauffeur go down to the cellar first." The companion becomes a disposable probe and the player stops risking their own skin, which is the core of horror.
- **Action economy inflation** — four players plus four companions is eight actors; combat doubles, investigation gets solved by sending servants.
- **Spotlight theft** — a companion with a good skill overshadows the player who is weak at it.

A full stat block is an invitation to the dungeon: if the companion has HP, Dodge and a damage bonus, sooner or later someone tests how much he can take. Hence definition **by function, not by stats**.

### Two categories, one promotion path

- **Służba wymienna** (interchangeable staff) — chosen for the job from the household, swapped in downtime, **one active at a time**. No emotional weight and no pretence of it. Their death hits **Szacunek**, not Sanity.
- **Stały towarzysz** (bonded companion) — the one who drove you for three scenarios and once waited outside listening to what happened inside. Not swappable, may occupy **źródła slot 3**, and their death hits Sanity like the death of a loved one.

After several scenarios with the same person the player may **promote** them from the first category to the second. This gives swapping a real opportunity cost: whoever takes a different tool every scenario never builds an anchor and always pays purely in Szacunek.

### Definition

**Role + 3 skills, all within that role**: main 60–70%, secondary 50%, tertiary 40%. Characteristics only if the fiction forces a roll; otherwise an average person, not written out. The "all skills in-role" constraint alone solves spotlight theft, because the companion is always a narrow specialist rather than a general-purpose adventurer.

| Role | Skills |
|---|---|
| **Szofer** | Prowadzenie 70 · Mechanika 50 · Spostrzegawczość 40 |
| **Sekretarz** | Biblioteka 70 · Rachunkowość 50 · Język obcy 40 |
| **Ochroniarz** | Walka wręcz 60 · Broń palna 50 · Zastraszanie 40 |
| **Kamerdyner** | Nasłuchiwanie 60 · Etykieta 50 · Ukrywanie się 40 |
| **Pielęgniarka** | Pierwsza pomoc 70 · Medycyna 50 · Psychologia 40 |
| **Asystent naukowy** | Nauka (chosen) 60 · Fotografia 50 · Spostrzegawczość 40 |
| **Miejscowy przewodnik** *(temporary, in travel)* | Nawigacja 60 · Język 60 · Perswazja 40 |

### Control and action economy

- **The Keeper runs the companion, not the player.** This is what keeps them a separate being rather than an extension of the player, and it drains most of the motivation to use them as a tool.
- The companion **has their own turn** in combat. One extra shooter does not break a party, and few characters clear the wealth gate anyway.
- **Zasłonięcie sobą** (interpose) is free: the companion may take a blow aimed at their employer as a reaction, at the cost of their own skin. That is the essence of the job.
- If Keeper load becomes a problem, the cheapest brake is price, not rules: at Majętność 50+ few players have one and nobody has two.

### Zones of availability

| Zone | Companion |
|---|---|
| **Zaplecze** — drives, waits, delivers, watches, arranges | acts freely, no rolls |
| **Scena śledcza** — conversations, searching, travel | acts once per scene, in role, on the player's declaration |
| **Niebezpieczeństwo** — violence, Mythos, horror | **refuses** |

The refusal is not Keeper fiat but realism: an ordinary person does not go down into a cellar those noises are coming from. A player may attempt persuasion, but success means **they put that person there** and own everything that follows.

### Light version (recommended starting point)

Before writing skills for anyone, consider the no-numbers variant: the companion grants **2–3 favours per scenario** — "a logistical problem goes away." Transport is there, the car waits with the engine running, the parcel arrived, someone is keeping watch, someone got you out of the cells. They have a name, a face and a personality but no stat block, so nobody works out how much they can take. In roughly 90% of cases this is sufficient; add the skill line only when a specific companion starts genuinely entering scenes.

### Travel

A chauffeur from Boston is no help in Cairo. Either you pay to bring him (another Majętność drain) or you hire a **miejscowy przewodnik** — a temporary companion for one scenario. This also solves the travelling-cast problem: each city adds a new face to like and to lose.

### Death and Szacunek

Majętność/Szacunek measures respect and standing, not only money — a person whose servants die stops being someone worth serving for. This is the penalty that stops anyone using people as mine detectors.

| Situation | Szacunek |
|---|---|
| Died through no fault of yours, family provided for, handled with class | no loss (severance paid in cash) |
| Died because you led them there | **−1k6** |
| Died horribly, vanished without trace, you covered it up, **or it is not the first time** | **−2k6** |

- **Escalation:** the third corpse is not an accident, it is a reputation. Every subsequent death in the campaign moves one step up — after the second, always at least −2k6 regardless of circumstances.
- **Hiring floor:** below **Szacunek 50 nobody can be hired.** Only companions earned in the fiction remain — people who follow you despite everything rather than for money. Recovering access requires rebuilding Szacunek through play.
- The penalty covers **everything that makes you a bad employer**, not only death: a servant who runs screaming and tells the city, one who sells what he saw to the papers after being dismissed, a scandal, unpaid wages.

> [!note] Concealment
> This is the best candidate in the whole document for hiding the precise mechanics from players. The content players should experience is people's reactions, not the numbers.

---

## 7. Majętność + Szacunek (Wealth + Standing)

### The real question

Nobody wants to count hotels and ammunition, because the answer is always "yes I can afford it" or "no I can't" and nothing follows from it. The interesting question in a long campaign is **what money is doing to you**. So the bookkeeping is not automated but *removed*, and replaced with three layers.

### Layer 1 — below the spending level, never tracked

Already present in wealth v2 and it is the RAW 7e answer. Hotels, meals, tickets, ammunition, cabs: if it fits inside the spending level, it simply is. No rolls, no records. This eliminates roughly 90% of the bookkeeping outright.

### Layer 2 — two channels of outflow

- **Stałe zobowiązania** (permanent commitments) — a chauffeur, a second house, a club, supporting family, a garage. These **never enter any roll**. They lower the free amount once, at the moment they are taken on, and then sit on the sheet. Exactly how wealth v2 already works. Hiring a chauffeur simply reduces what you can spend without thinking: zero in-play bookkeeping, one operation at signing.
- **Wydatki jednorazowe** (one-off expenses) — tickets, bribes, charters, equipment. Only these need a scale.

### Layer 3 — the expense scale, measured in time-to-earn

Do not measure an expense in dollars; measure it in **how long it would take to earn at your standard of living**. One table then serves a pauper and a millionaire, and the Keeper never consults a price list — only asks "how long would this person have to work for that?"

| Scale | Size | Effect |
|---|---|---|
| **Niezauważalny** | up to a day of expenses | not counted at all |
| **Drobny** | up to a week | no trace; only accumulation matters |
| **Znaczący** | up to a month | **1 burden** |
| **Wielki** | up to a year | **3 burdens** |
| **Poza zasięgiem** | over a year | impossible without selling assets, a loan, or a patron |

Validated against the two cases that motivated the scale. Train tickets for a four-hour journey for the party (~$20): **niezauważalny** for a tier-F millionaire, **drobny** for an average character, **znaczący** for a poor one. Chartering a steamer across half the world (several to a dozen thousand): **wielki** for the millionaire, **poza zasięgiem** for everyone else. The scale distinguishes these with no extra rules and no price list.

### Free allowance and the roll

Burdens are compared against a free allowance keyed to the existing wealth v2 tiers. **You do not get poorer by living within your means** — only by overreaching.

| Tier | Burdens without consequence |
|---|---|
| A–B (bezdomny, ubogi) | 0 |
| C (przeciętny) | 1 |
| D (zamożny) | 2 |
| E (bardzo zamożny) | 3 |
| F (bogaty) | 4 |

A millionaire can finance the party's travel, keep a chauffeur and buy a car and **roll nothing** — that is simply his life. The roll appears when he charters a ship and bribes an official in the same month.

**No arithmetic at the table.** One question at the end of the scenario, in the same spirit as the Zew test:

> **Did you live beyond your means?** — nie / trochę / wyraźnie.

The burden list stays as *examples for calibration*, not a checklist to total. In most scenarios most players answer "nie" and nothing happens.

**The roll is a chance to absorb the expense, not a chance to be hit** (the framing matters):

- *trochę* → regular Majętność roll. Success: you came out even. Failure: **−1**.
- *wyraźnie* → hard roll. Success: barely, but you managed. Failure: **−1k6**.

> [!warning] Rejected earlier version
> The first design counted burdens and rolled at a penalty per burden. At Majętność 60 with three burdens that is a 70% failure chance and −1k6 per scenario — and worse, **falling Majętność made the roll harder, i.e. a death spiral**, exactly what was deliberately avoided for Sanity. The free-allowance + overreach-only structure removes it: at low Majętność you have nothing to overreach with, so you stop rolling.

### The split

Majętność and Szacunek separate **after** character creation. Both start equal to the occupation's Credit Rating, so nothing changes during creation and nothing needs recomputing retroactively. In the app this is one extra field.

| | Governs | Lowered by | Recovers through |
|---|---|---|---|
| **Majętność** | spending level, what you can buy, assets, permanent commitments | overreached spending, losses, medical bills, destroyed property | **income events**: payment, inheritance, sale, a good season at work |
| **Szacunek** | who talks to you, credit, access to institutions, ability to hire, social rolls | servant deaths, scandal, witnesses fleeing in terror, unpaid wages | **fiction only**: a public success, a patron who vouches for you, time and distance |

One number cannot be substituted for the other. A player whose people die cannot rebuild reputation by bank transfer — he has to earn it at the table. A player who merely overspent climbs out with the first good commission.

**Drift (the mutual pull), deliberately lazy so it adds no rolls:** if the gap exceeds **20 points**, the higher of the two **falls by 1** at the end of the scenario, unless the player is actively doing something to maintain it. An impoverished aristocrat can live on his name for many sessions, but keeping up appearances costs effort; a *nouveau riche* may have a full safe and closed doors, but sooner or later money starts buying acquaintance. Convergence is slow, one point at a time, and always stoppable through fiction — which means both of those interesting character states are **reachable and sustainable, just not free**. Drift is downward only; increases in either value come exclusively from events.

### Gains

Neither value improves by development check — successfully using credit does not make you richer. Both move **through events**: inheritance, payment for a job, selling an artefact, a patron, a successful downtime investment; and downward through treatment, bribes, funding expeditions, paying trainers for colleagues.

**Net balance should be slightly negative.** Investigators ruin themselves investigating — canon from Lovecraft onward. Wealth as a slowly declining resource that adventure occasionally replenishes does three things at once: it finally gives wealth v2 a purpose, it creates the pressure that feeds the Nienasycenie Zew, and it makes paying a trainer a real decision rather than a formality.

**The rich-banker dynamic resolves itself:** whoever pays for everyone collects everyone's burdens, so his Majętność falls fastest. After a dozen-odd sessions the patron is merely well-off rather than rich — precisely the change currently missing. Optionally the other side too: **accepting funding creates a debt** that the Zobowiązanie Zew feeds on.

### Parked — price dictionary

Players improvise, so a per-scenario prep list does not cover everything. Considered (**not decided, not now**): a large electronic dictionary with an LLM as a **semantic matching layer, not a pricing engine** — the player says "I want to hire a boat to reach the island", the catalogue holds "hire of a fishing cutter with crew, per day". Matching against a supplied list is what models do well and where they hallucinate least.

Design notes for whenever this is built:

- **Granularity matched to how players ask, not to realism.** "Hire of a boat with crew, per day" covers a thousand phrasings; "the cutter *Maria*, 1923" covers one. Write services and categories, not products.
- **Multipliers instead of multiplying entries**: one entry plus "×2 in a big city, ×0.5 in the provinces, ×3 if illegal or urgent" replaces a dozen rows. This is the main mechanism keeping the catalogue small.
- Roughly **16 categories × 30–60 entries = 500–1000 rows** covers most improvisation. At that size **no RAG, embeddings or vector store is needed** — 1000 short entries is ~20–40k tokens and fits entirely in context. The naive solution (paste the catalogue, ask the question) is also the most accurate, because the model sees everything rather than whatever retrieval surfaced.
- **Generate in batches, by category, anchored on the existing `equipmentV2.ts`** (110+ 1920s entries, 114 Wild West). Without those anchors the new catalogue's prices will drift away from the shop players already saw during character creation — which they notice far faster than a historical error.
- **The catalogue is the source of truth; the model only fills gaps, and its answer immediately becomes canon.** Never ask twice about the same thing: inconsistency between sessions hurts far more than an imprecise price. Ask for **ranges, not exact sums**.
- Mark generated entries separately from verified ones. A generated price list **will** contain errors and an error in a table looks authoritative. **Internal consistency matters more than historical accuracy** — nobody will check whether a 1925 boat charter cost $180 or $240, but everyone notices if it is $180 today and $600 next month.
- Big purchases go through a **between-sessions request queue** — the player asks, the Keeper prices it calmly before the next session, and the Majętność roll happens there since it is a downtime operation anyway.

Correct sequencing: the design above works without the dictionary, with a little judgement at the table. Build it once the rules are bedded in and a few dozen real queries from actual sessions define the scope better than guessing now can.

---

## 8. Wygląd jako sieć społeczna (Appearance as social network)

APP is repurposed as a **long-term social-reach statistic**. Safe to overload: it feeds no derived attribute (verified above). A high Wygląd does not mean beautiful — it may mean charming, warm, imposing, or notorious, though beauty is one legitimate expression of it.

### The main gain — it revives the contact system

- **You have a relevant kontakt** → use them (see §9). A specific person, a more reliable outcome.
- **You do not** → roll Wygląd. Success means you **find someone** — effectively a fresh acquaintance.
- Return to that person, have it go well, and they become a real kontakt.

Both systems then justify each other: kontakty are valuable because they beat the Wygląd roll, and Wygląd is valuable because it **builds the contact list during play** instead of freezing it at character creation.

### Division of labour with Szacunek

| | Question | Axis |
|---|---|---|
| **Szacunek** | will someone important take you seriously? | vertical — institutions, class, name |
| **Wygląd** | do you know *anyone at all* who can help? | horizontal — reach, acquaintance, being liked |

An aristocrat with high Szacunek and low Wygląd has doors open at the top and no friends; a charming bartender the reverse. They combine well: **Wygląd finds the person, Szacunek makes them want to help.**

### Roll framework

- **Success yields a lead, not a solution** — a name, an address, a letter of introduction, a telephone number. Never the information itself. The person found is a character with their own interests and price, not a dispenser.
- **Difficulty scales with how exotic the need is**, not with how important the matter is: someone who can fix an engine — regular; someone who reads Aramaic — hard; someone who can get you into the Vatican archives — extreme. This is the entire power control: one axis, no tables.
- **It costs time** — hours or days of telephone calls and visits. So it does not work in a crisis and does not replace investigation.
- **Once per scenario per field.** Failure is "nobody comes to mind right now" and only returns when circumstances change. Standard 7e, nothing new to remember.

### Decoupling from beauty

At character creation the player **declares in one sentence how their Wygląd manifests** — looks, warmth, wit, gravitas, fame, being memorable, even notoriety. Same construction as the Zew rozwinięcie: the category carries the mechanics, the description carries the colour. Costs nothing and permanently settles whether a character with 75 has to be pretty.

Optional: renaming the display label to **"Prezencja"** carries that meaning without explanation. In the app this is a display label — the `APP` key can stay untouched, so nothing breaks in cards or PDFs.

### Growth

Since Wygląd now does a skill's job, it **develops like a skill**: a check for meaningful use, improvement roll on the same table as everything else. Safe precisely because nothing derives from it. Plus the natural downtime action **utrzymywanie znajomości** (dinners, correspondence, the club, the parish), competing for the same slots as study and pillar repair.

**One tension to resolve:** the aging table lowers APP, which under the new meaning is backwards — a network of acquaintance grows with age rather than shrinking. Three options: keep it (looks fade and that costs, and growth through play makes up for it), remove the age penalty from APP, or — recommended — keep it, because the positions and contacts system **already grants extra slots at age ≥40 and ≥45**, so the compensation has been sitting in the mechanics all along. Net: an older character has a worse roll but more ready-made contacts, which is exactly the truth about ageing.

---

## 9. Kontakty (Contacts)

The 50+ subcategory system is **removed**. Guiding principle of the replacement:

> **A kontakt is one person plus one named favour.** Not "you know policemen" but "Sergeant Malloy will look the other way once and check a name in the files."

### Type pool

| Type | What they will do for you |
|---|---|
| **Zaprzyjaźniony policjant** | look the other way, check a name, warn you that someone has been asking |
| **Bibliotekarka / archiwista** | let you in after hours, lend what is not lent, search the collection |
| **Kolega z pracy** | cover your absence, arrange leave, lie to the boss |
| **Lekarz** | patch you up without questions and without reporting it, write a certificate |
| **Dziennikarz** | the paper's archive, print something or pull it from the edition |
| **Urzędnik** | files, registers, land records, a permit without the queue |
| **Paser / przemytnik** | obtain something illegal, move something suspicious |
| **Prawnik** | get you out of custody, write a letter that makes an impression |
| **Duchowny** | the parish, baptismal registers, access to people (not to the seal of confession) |
| **Właściciel lokalu** | a bed with no entry in the register, a message passed, local gossip |
| **Dozorca / portier** | let you in, tell you who came and went |
| **Telefonistka / telegrafista** | connect you, pass a message, remember what went through |
| **Kolejarz / marynarz / kierowca** | transport off the timetable, carry something without questions |
| **Wykładowca** | an expert opinion, a recommendation, access to a laboratory |
| **Ktoś z półświatka** | word from the street, protection, a threat delivered in your name |

> [!note] Kolega z pracy
> Looks the humblest and is probably the most practical — it solves the problem the downtime and wealth systems create for themselves: **how a character disappears for two months and keeps their job.**

### Use — no roll, but wear

No roll. The favour simply works; the limit is its **scope**, not a die. The Keeper adjudicates one question: does this fall within what that person will do for you?

Instead, a relationship state on the same three-step scale as the pillars: **świeża → nadwyrężona → spalona.** Wear happens when you ask for something outside the scope, ask too often, or the favour endangered them. A spalona relationship leaves the sheet and often leaves an enemy behind. One vocabulary across filary, źródła and kontakty is one less thing to remember at the table.

**Repair:** a downtime scene, competing with study, pillar repair, detox and socialising.

### Contacts as źródła

A kontakt may be a **źródło stabilności** from session one (max **one** per character — otherwise the contact pool merges with the source pool and flattens the design). The state of the relationship then **governs both functions at once**:

| State | Favour | Sanity recovery |
|---|---|---|
| **świeża** | works | works |
| **nadwyrężona** | still works | **gone** — that person resents you |
| **spalona** | gone | gone, and losing a source is a real blow |

So squeezing a contact dry starts costing Sanity, with no additional rule. Practical gain at creation: the relational slot is not empty in the first session, which removes the unevenness whereby one player earns a bond in session two and another in session eight.

### Numbers and origin

- **2 at creation, 3 if Wygląd ≥ 60.** The threshold 60 matches the old system's "social skill ≥60", so it stays inside the project's existing numeric language.
- **Not more than 3 even at Wygląd 80+** — the creation bonus and the in-play generation compound, so a high-Wygląd character would be rewarded twice for the same thing. Three at creation plus a better growth engine is already a clear specialisation.
- **Occupation shapes *which* types are available; Wygląd shapes *how many*.** A journalist picks from press, police, officials and the underworld; a lighthouse keeper from local fishermen, the railwayman and the parish priest. No extra arithmetic, and the old "networked / average / isolated" logic is preserved in a form that actually means something at the table.
- At very low Wygląd, still 2 contacts, but with a different justification: these are people **inherited, not won** — family, a schoolmate, someone who owes you a debt. Costs nothing and immediately explains why an off-putting recluse knows anyone at all.

### The full promotion ladder

> **przypadkowy znajomy → kontakt z nazwaną przysługą → źródło stabilności**

Only someone who genuinely became important reaches the last rung — and then their death costs Sanity, not merely a favour.

---

## Migration notes (existing data)

- **Zew:** `drive` + `drive_detail` already exist. Replace the `DRIVES` array (14 → 4) and add a flavour-hint list. Existing characters carry one of the 14 old values and need a remap to the 4 new categories — mechanical and lossless if the old value moves into `drive_detail` as the starting rozwinięcie.
- **Filary:** `pillars?: string[]` holds the text; state (`cały`/`nadwyrężony`/`zniszczony`) needs one new field.
- **Źródła:** `sources?: StabilitySource[]` exists with `category: 'person' | 'place' | 'organization'` — the category union must be replaced by the new slot model.
- **Kontakty:** old `contacts_v2` entries are **re-readable** as "person + favour" — a curation pass across ~23 characters, not a lossy migration.
- **Majętność / Szacunek:** one new field, initialised equal to the existing Credit Rating. No retroactive computation.
- **Wygląd:** no data change; optional display-label rename only.

## Open questions

> [!warning] Priority — źródła vs the new Sanity economy
> The źródła numbers (+1k3 per source, once per session per source) were set **before** the equilibrium maths existed. The award economy assumes ~4 dice **per scenario**, while five source slots could add a dozen-plus points **per session** — potentially several times the entire end-of-scenario award, which invalidates the whole calculation. Three candidate fixes: reduce frequency (not every source every session, e.g. any two), reduce value (1 flat point instead of 1k3), or move źródła entirely into downtime. **Must be resolved before playtest.**

- **Zew Szczęście reward (+3 max / +3 current)** predates the k6 unification and is now the only number in the system not expressed in dice. Candidate: 1k6, but then decide whether the ceiling rises by the rolled value or by a flat 3.
- **Trainer cost** — parked by the Keeper. Open: what is rolled, when the loss applies, what it costs to fund a colleague.
- **Filary numbers** — no calibration yet on how often pillar repair should be available relative to how often insanity thresholds are hit.
- **Physical characteristics** — decided **no** for now; revisit only if long campaigns feel static.
- **Price dictionary** — considered, not decided; see [[#Parked — price dictionary]].

### Next design step — integration into the generator

To be worked through separately, in two parts:

1. **New character creation** — where the new steps sit in the wizard (Zew with 4 categories + rozwinięcie picker; 3 filary; 5 źródła slots with the shared Ostoja needing party-level coordination; 2–3 kontakty gated on Wygląd ≥60 and shaped by occupation; the Wygląd manifestation sentence; Majętność/Szacunek initialised equal).
2. **Updating existing characters** — the remap paths above, plus deciding what the player fills in themselves versus what the admin backfills, and whether this rides the existing `edit_permission` machinery.

## Acceptance

- All nine systems have written rules with concrete numbers and no unresolved dependency between them.
- The źródła calibration question is closed.
- One end-of-session ritual covers Zew reward + development checks; one end-of-scenario ritual covers award, downtime and Majętność.
- A player can read their own card and know: their Zew and its rozwinięcie, three pillars with states, five sources, contacts with states, Majętność and Szacunek separately.
- The Keeper can run a session without consulting any table other than the expense scale and the growth table.
