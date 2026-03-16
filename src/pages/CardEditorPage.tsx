import { useState, useRef, useCallback, useEffect } from 'react'
import { CARD_LAYOUTS, type FieldBox, type SkillColumnGrid } from '@/data/cardFieldLayouts'
import { Button } from '@/components/ui/Button'
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react'

const BASE_URL = import.meta.env.BASE_URL ?? '/'
const STORAGE_KEY = 'coc-card-editor-layouts'

// ── Sample data to preview how real content looks in boxes ──

const SAMPLE_DATA: Record<string, string> = {
  // ── Front: Dane Badacza ──
  photo: '[foto]',
  name: 'Władysław Kowalski',
  player_name: 'Paweł',
  occupation: 'Profesor Archeologii',
  age: '42',
  gender: 'Mężczyzna',
  residence: 'Arkham, Massachusetts',
  birthplace: 'Kraków, Polska',
  death_place: '',

  // ── Cechy + połówki + piątki ──
  char_str: '55', char_str_half: '27', char_str_fifth: '11',
  char_dex: '60', char_dex_half: '30', char_dex_fifth: '12',
  char_pow: '70', char_pow_half: '35', char_pow_fifth: '14',
  char_con: '45', char_con_half: '22', char_con_fifth: '9',
  char_app: '65', char_app_half: '32', char_app_fifth: '13',
  char_edu: '80', char_edu_half: '40', char_edu_fifth: '16',
  char_siz: '50', char_siz_half: '25', char_siz_fifth: '10',
  char_int: '75', char_int_half: '37', char_int_fifth: '15',
  char_move: '7',

  // ── Pochodne ──
  san: '70', hp: '10', luck: '55', mp: '14',

  // ── Umiejętności — per skill ID wartości (total%) ──
  // Kolumna 1
  'skill:antropologia': '1', 'skill:archeologia': '45',
  'skill:bron_palna:karabin_strzelba': '25', 'skill:bron_palna:krotka': '50',
  'skill:bron_palna:_open1': '15', 'spec:bron_palna:_open1': 'Pistolet Masz.',
  'skill:charakteryzacja': '5', 'skill:elektryka': '10', 'skill:gadanina': '5',
  'skill:historia': '55', 'skill:jezdziectwo': '5',
  'skill:jezyk_obcy:_open1': '40', 'spec:jezyk_obcy:_open1': 'Łacina',
  'skill:jezyk_obcy:_open2': '25', 'spec:jezyk_obcy:_open2': 'Angielski',
  'skill:jezyk_ojczysty': '80',
  'skill:korzystanie_z_bibliotek': '60', 'skill:ksiegowosc': '5',
  'skill:majetnosc': '50', 'skill:mechanika': '10',
  // Kolumna 2
  'skill:medycyna': '1', 'skill:mity_cthulhu': '8', 'skill:nasluchiwanie': '20',
  'skill:nauka:_open1': '65', 'spec:nauka:_open1': 'Archeologia',
  'skill:nauka:_open2': '45', 'spec:nauka:_open2': 'Historia',
  'skill:nawigacja': '10', 'skill:obsluga_ciezkiego_sprzetu': '1',
  'skill:okultyzm': '35', 'skill:perswazja': '40', 'skill:pierwsza_pomoc': '30',
  'skill:pilotowanie:_open1': '1', 'spec:pilotowanie:_open1': 'Samolot',
  'skill:plywanie': '20', 'skill:prawo': '5',
  'skill:prowadzenie_samochodu': '20', 'skill:psychoanaliza': '1',
  'skill:psychologia': '10', 'skill:rzucanie': '20', 'skill:skakanie': '20',
  // Kolumna 3
  'skill:spostrzegawczosc': '55',
  'skill:sztuka_rzemioslo:_open1': '25', 'spec:sztuka_rzemioslo:_open1': 'Fotografia',
  'skill:sztuka_przetrwania': '10', 'skill:slusarstwo': '1',
  'skill:tropienie': '10', 'skill:ukrywanie': '20', 'skill:unik': '30',
  'skill:urok_osobisty': '15', 'skill:walka_wrecz:bijatyka': '25',
  'skill:walka_wrecz:_open1': '20', 'spec:walka_wrecz:_open1': 'Miecz',
  'skill:wiedza_o_naturze': '10', 'skill:wspinaczka': '20',
  'skill:wycena': '25', 'skill:zastraszanie': '15', 'skill:zreczne_palce': '10',

  // ── Nazwy specjalizacji (osobne pola) ──
  spec_bron_palna_1: 'Pist. Masz.',
  spec_bron_palna_2: '', spec_bron_palna_3: '',
  spec_jezyk_obcy_1: 'Łacina', spec_jezyk_obcy_2: 'Angielski', spec_jezyk_obcy_3: '',
  spec_nauka_1: 'Archeologia', spec_nauka_2: 'Historia', spec_nauka_3: '',
  spec_pilotaz_1: 'Samolot', spec_pilotaz_2: '',
  spec_sztuka_1: 'Fotografia', spec_sztuka_2: '', spec_sztuka_3: '',
  spec_walka_1: 'Miecz', spec_walka_2: '',

  // ── Uzbrojenie (5 broni × kolumny) ──
  weap1_name: 'Rewolwer .32', weap1_skill: '50', weap1_half: '25', weap1_fifth: '10', weap1_dmg: '1D8', weap1_range: '15m', weap1_attacks: '1', weap1_ammo: '6', weap1_malf: '100',
  weap2_name: 'Sztylet', weap2_skill: '45', weap2_half: '22', weap2_fifth: '9', weap2_dmg: '1D4+MO', weap2_range: 'dost.', weap2_attacks: '1', weap2_ammo: '—', weap2_malf: '—',
  weap3_name: 'Nieuzbrojony', weap3_skill: '25', weap3_half: '12', weap3_fifth: '5', weap3_dmg: '1D3+MO', weap3_range: 'dost.', weap3_attacks: '1', weap3_ammo: '—', weap3_malf: '—',
  weap4_name: '', weap4_skill: '', weap4_half: '', weap4_fifth: '', weap4_dmg: '', weap4_range: '', weap4_attacks: '', weap4_ammo: '', weap4_malf: '',
  weap5_name: '', weap5_skill: '', weap5_half: '', weap5_fifth: '', weap5_dmg: '', weap5_range: '', weap5_attacks: '', weap5_ammo: '', weap5_malf: '',

  // ── Walka ──
  damage_bonus: '0',
  build: '0',
  dodge: '30',

  // ── Zasoby ──
  spending_level: 'Średni',
  cash: '$142',

  // ── Back classic ──
  appearance_description: 'Wysoki, szczupły mężczyzna o przenikliwym spojrzeniu zza okrągłych okularów. Nosi tweedową marynarkę z łatami na łokciach i zawsze ma przy sobie skórzaną teczkę pełną notatek.',
  ideology: 'Wiedza naukowa jest kluczem do zrozumienia wszechświata. Wszystko można wyjaśnić, jeśli się wystarczająco głęboko kopie — nawet jeśli odpowiedzi nie są takie, jakich byśmy sobie życzyli.',
  significant_people: 'Prof. Helena Nowak — mentorka z czasów studiów w Krakowie, jedyna która wierzy w moje odkrycia. Brat Stanisław — mieszka w Warszawie, martwi się o moje zdrowie psychiczne.',
  meaningful_locations: 'Biblioteka Uniwersytetu Jagiellońskiego — tu wszystko się zaczęło. Ruiny w dolinie Miskatonic — miejsce mojego największego odkrycia i największego koszmaru.',
  traits: 'Kompulsywne notowanie obserwacji. Nie śpi dobrze od wyprawy do Innsmouth. Mówi do siebie po łacinie gdy jest zdenerwowany. Kolekcjonuje stare mapy.',

  // ── Back ToC ──
  pillars: '• Postęp naukowy — rozum wyjaśni wszystko\n• Godność człowieka — ludzie mają wartość\n• Prawa fizyki — świat działa wg stałych reguł',
  sources: '• Prof. Helena Nowak (Osoba) — mentorka\n• Biblioteka UJ (Miejsce) — tu świat ma sens\n• Tow. Archeologiczne (Org.) — koledzy po fachu',
  drive: 'Ciekawość — Kiedy napotykam tajemnicę, nie mogę się powstrzymać. Do diabła z ryzykiem — muszę się dowiedzieć.',
  other_traits: 'Kompulsywne notowanie. Mówi po łacinie gdy zdenerwowany. Kolekcjonuje stare mapy.',

  // ── Bottom shared ──
  equipment: '• Skórzana teczka\n• Rewolwer .32 (6 naboi)\n• Latarka elektryczna\n• Zestaw do rysowania\n• Lupa\n• Apteczka polowa',
  assets: '• Mieszkanie w Arkham\n• Stary Ford Model A\n• Kolekcja artefaktów',
}

function loadSaved(): Record<string, FieldBox[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveToDisk(layoutId: string, fields: FieldBox[]) {
  const data = loadSaved()
  data[layoutId] = fields
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const GRIDS_STORAGE_KEY = 'coc-card-editor-grids'

function loadSavedGrids(): Record<string, SkillColumnGrid[]> {
  try {
    const raw = localStorage.getItem(GRIDS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveGridsToDisk(layoutId: string, grids: SkillColumnGrid[]) {
  const data = loadSavedGrids()
  data[layoutId] = grids
  localStorage.setItem(GRIDS_STORAGE_KEY, JSON.stringify(data))
}

type DragMode = 'move' | 'resize-br' | 'marquee' | null

interface DragState {
  mode: DragMode
  startX: number
  startY: number
  originals: Map<string, { x: number; y: number; w: number; h: number }>
  started?: boolean // true once mouse moved enough to start real drag
}

interface MarqueeRect {
  x: number; y: number; w: number; h: number // % of card
}

export function CardEditorPage() {
  const [layoutIdx, setLayoutIdx] = useState(0)
  const layout = CARD_LAYOUTS[layoutIdx]
  const [fields, setFields] = useState<FieldBox[]>(() => {
    const saved = loadSaved()
    return saved[layout.id] ?? layout.fields.map((f) => ({ ...f }))
  })
  const [grids, setGrids] = useState<SkillColumnGrid[]>(() => {
    const saved = loadSavedGrids()
    return saved[layout.id] ?? (layout.skillGrids ?? []).map((g) => ({ ...g, rows: [...g.rows] }))
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(0.3)
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState(false)
  const [fieldFilter, setFieldFilter] = useState('')
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)
  const marqueeRef = useRef<MarqueeRect | null>(null)
  marqueeRef.current = marquee
  const containerRef = useRef<HTMLDivElement>(null)

  // Image dimensions in px (all cards are 2479x3508)
  const IMG_W = 2479
  const IMG_H = 3508

  // Switch layout
  const switchLayout = (idx: number) => {
    setLayoutIdx(idx)
    const l = CARD_LAYOUTS[idx]
    const savedF = loadSaved()
    setFields(savedF[l.id] ?? l.fields.map((f) => ({ ...f })))
    const savedG = loadSavedGrids()
    setGrids(savedG[l.id] ?? (l.skillGrids ?? []).map((g) => ({ ...g, rows: [...g.rows] })))
    setSelected(new Set())
  }

  // Auto-save on field/grid changes
  useEffect(() => { saveToDisk(layout.id, fields) }, [fields, layout.id])
  useEffect(() => { if (grids.length > 0) saveGridsToDisk(layout.id, grids) }, [grids, layout.id])

  const resetToDefaults = () => {
    if (!confirm('Zresetować pozycje do domyślnych?')) return
    const l = CARD_LAYOUTS[layoutIdx]
    setFields(l.fields.map((f) => ({ ...f })))
    setGrids((l.skillGrids ?? []).map((g) => ({ ...g, rows: [...g.rows] })))
    const data = loadSaved()
    delete data[layout.id]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const gData = loadSavedGrids()
    delete gData[layout.id]
    localStorage.setItem(GRIDS_STORAGE_KEY, JSON.stringify(gData))
  }

  const resetAll = () => {
    if (!confirm('Usunąć WSZYSTKIE zapisane pozycje dla wszystkich kart?')) return
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(GRIDS_STORAGE_KEY)
    const l = CARD_LAYOUTS[layoutIdx]
    setFields(l.fields.map((f) => ({ ...f })))
    setGrids((l.skillGrids ?? []).map((g) => ({ ...g, rows: [...g.rows] })))
  }

  // --- Selection ---
  const handleFieldClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Multi-key clicks are handled in onMouseDown — skip here
    if (e.shiftKey || e.ctrlKey || e.metaKey) return
    setSelected(new Set([id]))
  }

  const handleCanvasClick = () => {
    if (!dragState && !marquee) setSelected(new Set())
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only start marquee if clicking directly on the container or the image
    const target = e.target as HTMLElement
    if (target !== containerRef.current && target.tagName !== 'IMG') return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    setDragState({ mode: 'marquee', startX: e.clientX, startY: e.clientY, originals: new Map() })
    setMarquee({ x: px, y: py, w: 0, h: 0 })
    if (!e.shiftKey) setSelected(new Set())
  }

  // --- Drag & Resize ---
  const pxToPercent = useCallback((dx: number, dy: number) => {
    const scaledW = IMG_W * zoom
    const scaledH = IMG_H * zoom
    return { dpx: (dx / scaledW) * 100, dpy: (dy / scaledH) * 100 }
  }, [zoom])

  const startDrag = (mode: DragMode, e: React.MouseEvent, activeIds?: Set<string>) => {
    e.stopPropagation()
    e.preventDefault()
    const ids = activeIds ?? selected
    const originals = new Map<string, { x: number; y: number; w: number; h: number }>()
    for (const id of ids) {
      const f = fields.find((ff) => ff.id === id)
      if (f) { originals.set(id, { x: f.x, y: f.y, w: f.w, h: f.h }); continue }
      const g = grids.find((gg) => gg.id === id)
      if (g) originals.set(id, { x: g.x, y: g.y, w: g.w, h: g.h })
    }
    setDragState({ mode, startX: e.clientX, startY: e.clientY, originals })
  }

  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY

      if (dragState.mode === 'marquee') {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const startPx = ((dragState.startX - rect.left) / rect.width) * 100
        const startPy = ((dragState.startY - rect.top) / rect.height) * 100
        const curPx = ((e.clientX - rect.left) / rect.width) * 100
        const curPy = ((e.clientY - rect.top) / rect.height) * 100
        setMarquee({
          x: Math.min(startPx, curPx), y: Math.min(startPy, curPy),
          w: Math.abs(curPx - startPx), h: Math.abs(curPy - startPy),
        })
        return
      }

      const { dpx, dpy } = pxToPercent(dx, dy)

      const applyDrag = <T extends { id: string; x: number; y: number; w: number; h: number }>(items: T[]): T[] =>
        items.map((f) => {
          const orig = dragState.originals.get(f.id)
          if (!orig) return f
          if (dragState.mode === 'move') {
            return { ...f, x: Math.max(0, Math.min(100 - f.w, orig.x + dpx)), y: Math.max(0, Math.min(100 - f.h, orig.y + dpy)) }
          }
          if (dragState.mode === 'resize-br') {
            return { ...f, w: Math.max(1, orig.w + dpx), h: Math.max(0.5, orig.h + dpy) }
          }
          return f
        })
      setFields((prev) => applyDrag(prev))
      setGrids((prev) => applyDrag(prev))
    }

    const handleMouseUp = () => {
      // Marquee select: find all fields/grids intersecting the marquee
      const mq = marqueeRef.current
      if (dragState.mode === 'marquee' && mq && mq.w > 0.5 && mq.h > 0.5) {
        const hits = new Set<string>()
        const intersects = (item: { x: number; y: number; w: number; h: number; id: string }) =>
          item.x < mq.x + mq.w && item.x + item.w > mq.x &&
          item.y < mq.y + mq.h && item.y + item.h > mq.y
        for (const f of fields) { if (intersects(f)) hits.add(f.id) }
        for (const g of grids) { if (intersects(g)) hits.add(g.id) }
        setSelected((prev) => new Set([...prev, ...hits]))
      }
      setMarquee(null)
      setDragState(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, pxToPercent])

  // --- Keyboard nudge ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selected.size === 0) return
      const step = e.shiftKey ? 0.5 : 0.1
      let dx = 0, dy = 0
      if (e.key === 'ArrowLeft') dx = -step
      if (e.key === 'ArrowRight') dx = step
      if (e.key === 'ArrowUp') dy = -step
      if (e.key === 'ArrowDown') dy = step
      if (dx === 0 && dy === 0) return
      e.preventDefault()
      setFields((prev) =>
        prev.map((f) =>
          selected.has(f.id)
            ? { ...f, x: Math.max(0, f.x + dx), y: Math.max(0, f.y + dy) }
            : f
        )
      )
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selected])

  // --- Batch resize ---
  const batchResize = (dw: number, dh: number) => {
    setFields((prev) =>
      prev.map((f) =>
        selected.has(f.id)
          ? { ...f, w: Math.max(1, f.w + dw), h: Math.max(0.5, f.h + dh) }
          : f
      )
    )
  }

  // --- Field property editor ---
  const updateField = (id: string, key: keyof FieldBox, value: number | string | boolean) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, [key]: value } : f))
  }

  // --- Export ---
  const exportJson = () => {
    const data = {
      [layout.id]: { fields, skillGrids: grids.length > 0 ? grids : undefined },
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportAllJson = () => {
    const allData: Record<string, { fields: FieldBox[]; skillGrids?: SkillColumnGrid[] }> = {}
    const savedG = loadSavedGrids()
    CARD_LAYOUTS.forEach((l, i) => {
      allData[l.id] = {
        fields: i === layoutIdx ? fields : l.fields,
        skillGrids: i === layoutIdx ? grids : (savedG[l.id] ?? l.skillGrids),
      }
    })
    navigator.clipboard.writeText(JSON.stringify(allData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedFields = fields.filter((f) => selected.has(f.id))
  const selectedGrid = grids.find((g) => selected.has(g.id) && selected.size === 1)

  const updateGrid = (id: string, key: string, value: number) => {
    setGrids((prev) => prev.map((g) => g.id === id ? { ...g, [key]: value } : g))
  }

  return (
    <div className="flex h-screen bg-coc-bg text-coc-text overflow-hidden">
      {/* Left panel */}
      <div className="w-72 bg-coc-surface border-r border-coc-border flex flex-col overflow-hidden">
        <div className="p-3 border-b border-coc-border space-y-2">
          <h2 className="text-sm font-bold font-serif">Edytor karty</h2>
          <div className="flex gap-1">
            {CARD_LAYOUTS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => switchLayout(i)}
                className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                  i === layoutIdx ? 'bg-coc-accent text-white' : 'bg-coc-surface-light text-coc-text-muted hover:text-coc-text'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1 items-center">
            <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.05))} className="p-1 rounded bg-coc-surface-light border border-coc-border cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1, z + 0.05))} className="p-1 rounded bg-coc-surface-light border border-coc-border cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
            <span className="mx-1 text-coc-border">|</span>
            <button
              onClick={() => setPreview((p) => !p)}
              className={`p-1 rounded border cursor-pointer transition-colors ${preview ? 'bg-coc-accent/20 border-coc-accent/50 text-coc-accent-light' : 'bg-coc-surface-light border-coc-border text-coc-text-muted'}`}
              title="Podgląd z przykładowymi danymi"
            >
              {preview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button size="sm" variant="secondary" onClick={exportJson}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Skopiowano!' : 'Kopiuj JSON'}
            </Button>
            <Button size="sm" variant="secondary" onClick={exportAllJson}>
              Kopiuj wszystko
            </Button>
            <Button size="sm" variant="ghost" onClick={resetToDefaults}>
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
            <Button size="sm" variant="ghost" onClick={resetAll}>
              Reset ALL
            </Button>
          </div>
          <div className="text-[10px] text-coc-text-muted">Auto-zapis do localStorage</div>
        </div>

        {/* Batch controls */}
        {selected.size > 1 && (
          <div className="p-3 border-b border-coc-border space-y-1">
            <div className="text-xs text-coc-text-muted font-medium">Zaznaczone: {selected.size}</div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => batchResize(1, 0)} className="text-xs px-2 py-0.5 bg-coc-surface-light rounded border border-coc-border cursor-pointer hover:bg-coc-border">W+1</button>
              <button onClick={() => batchResize(-1, 0)} className="text-xs px-2 py-0.5 bg-coc-surface-light rounded border border-coc-border cursor-pointer hover:bg-coc-border">W-1</button>
              <button onClick={() => batchResize(0, 1)} className="text-xs px-2 py-0.5 bg-coc-surface-light rounded border border-coc-border cursor-pointer hover:bg-coc-border">H+1</button>
              <button onClick={() => batchResize(0, -1)} className="text-xs px-2 py-0.5 bg-coc-surface-light rounded border border-coc-border cursor-pointer hover:bg-coc-border">H-1</button>
            </div>
            <div className="text-[10px] text-coc-text-muted">Strzałki = przesuń (Shift = szybciej)</div>
          </div>
        )}

        {/* Skill grid list */}
        {grids.length > 0 && (
          <div className="p-2 border-b border-coc-border">
            <div className="text-[10px] text-coc-text-muted font-medium uppercase mb-1">Siatki umiejętności</div>
            {grids.map((g) => (
              <button
                key={g.id}
                onClick={(e) => handleFieldClick(g.id, e)}
                className={`w-full text-left text-xs px-2 py-1 rounded cursor-pointer transition-colors mb-0.5 ${
                  selected.has(g.id)
                    ? 'bg-coc-accent/20 text-coc-accent-light border border-coc-accent/40'
                    : 'hover:bg-coc-surface-light text-coc-text-muted border border-transparent'
                }`}
              >
                <div className="font-medium">{g.label} ({g.rows.length})</div>
                <div className="font-mono text-[10px] opacity-60">
                  {g.x.toFixed(1)}, {g.y.toFixed(1)} — {g.w.toFixed(1)}×{g.h.toFixed(1)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Field list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <input
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            placeholder="Szukaj pola..."
            className="w-full px-2 py-1 mb-1 bg-coc-surface-light border border-coc-border rounded text-xs text-coc-text placeholder:text-coc-text-muted/50 focus:outline-none focus:border-coc-accent-light"
          />
          {fields.filter((f) => !fieldFilter || f.label.toLowerCase().includes(fieldFilter.toLowerCase()) || f.id.toLowerCase().includes(fieldFilter.toLowerCase())).map((f) => (
            <button
              key={f.id}
              onClick={(e) => handleFieldClick(f.id, e)}
              className={`w-full text-left text-xs px-2 py-1.5 rounded cursor-pointer transition-colors ${
                selected.has(f.id)
                  ? 'bg-coc-accent/20 text-coc-accent-light border border-coc-accent/40'
                  : 'hover:bg-coc-surface-light text-coc-text-muted border border-transparent'
              }`}
            >
              <div className="font-medium">{f.label}</div>
              <div className="font-mono text-[10px] opacity-60">
                {f.x.toFixed(1)}, {f.y.toFixed(1)} — {f.w.toFixed(1)}×{f.h.toFixed(1)}
              </div>
            </button>
          ))}
        </div>

        {/* Property editor for single selection */}
        {selectedFields.length === 1 && (
          <div className="p-3 border-t border-coc-border space-y-2">
            <div className="text-xs font-medium">{selectedFields[0].label}</div>
            <div className="grid grid-cols-2 gap-1">
              {(['x', 'y', 'w', 'h'] as const).map((key) => (
                <div key={key}>
                  <label className="text-[10px] text-coc-text-muted uppercase">{key}</label>
                  <input
                    type="number"
                    step={0.1}
                    value={selectedFields[0][key]}
                    onChange={(e) => updateField(selectedFields[0].id, key, parseFloat(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-coc-surface-light border border-coc-border rounded text-xs font-mono text-coc-text focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-coc-text-muted uppercase">fontSize</label>
                <input
                  type="number"
                  step={0.5}
                  value={selectedFields[0].fontSize ?? 10}
                  onChange={(e) => updateField(selectedFields[0].id, 'fontSize', parseFloat(e.target.value) || 10)}
                  className="w-full px-1.5 py-0.5 bg-coc-surface-light border border-coc-border rounded text-xs font-mono text-coc-text focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-coc-text-muted uppercase">align</label>
                <select
                  value={selectedFields[0].align ?? 'left'}
                  onChange={(e) => updateField(selectedFields[0].id, 'align', e.target.value)}
                  className="w-full px-1.5 py-0.5 bg-coc-surface-light border border-coc-border rounded text-xs text-coc-text cursor-pointer"
                >
                  <option value="left">left</option>
                  <option value="center">center</option>
                  <option value="right">right</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Grid property editor */}
        {selectedGrid && (
          <div className="p-3 border-t border-coc-border space-y-2">
            <div className="text-xs font-medium text-green-400">{selectedGrid.label}</div>
            <div className="grid grid-cols-2 gap-1">
              {(['x', 'y', 'w', 'h'] as const).map((key) => (
                <div key={key}>
                  <label className="text-[10px] text-coc-text-muted uppercase">{key}</label>
                  <input type="number" step={0.1} value={selectedGrid[key]}
                    onChange={(e) => updateGrid(selectedGrid.id, key, parseFloat(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-coc-surface-light border border-coc-border rounded text-xs font-mono text-coc-text focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              ))}
            </div>
            <div className="text-[10px] text-coc-text-muted uppercase mt-1">Sub-kolumny (% szer. kolumny)</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { key: 'valueX', label: 'Wart. X' },
                { key: 'halfX', label: '½ X' },
                { key: 'fifthX', label: '⅕ X' },
                { key: 'cellW', label: 'Szer. kratki' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] text-coc-text-muted">{label}</label>
                  <input type="number" step={0.5} value={(selectedGrid as unknown as Record<string, number>)[key]}
                    onChange={(e) => updateGrid(selectedGrid.id, key, parseFloat(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-coc-surface-light border border-coc-border rounded text-xs font-mono text-coc-text focus:outline-none focus:border-coc-accent-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-neutral-900" onClick={handleCanvasClick}>
        <div
          ref={containerRef}
          onMouseDown={handleCanvasMouseDown}
          className="relative inline-block m-8"
          style={{
            width: IMG_W * zoom,
            height: IMG_H * zoom,
          }}
        >
          <img
            src={`${BASE_URL}${layout.image.replace(/^\//, '')}`}
            alt={layout.name}
            className="w-full h-full pointer-events-none select-none"
            draggable={false}
          />

          {/* Field overlays */}
          {fields.map((f) => {
            const isSelected = selected.has(f.id)
            const sampleText = SAMPLE_DATA[f.id]
            const displayText = preview && sampleText ? sampleText : f.label
            const isLongText = preview && sampleText && sampleText.length > 40
            return (
              <div
                key={f.id}
                onClick={(e) => handleFieldClick(f.id, e)}
                onMouseDown={(e) => {
                  const multiKey = e.shiftKey || e.ctrlKey || e.metaKey
                  if (multiKey) {
                    e.stopPropagation()
                    e.preventDefault()
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (next.has(f.id)) next.delete(f.id)
                      else next.add(f.id)
                      return next
                    })
                    return
                  }
                  let activeIds: Set<string>
                  if (!selected.has(f.id)) {
                    activeIds = new Set([f.id])
                    setSelected(activeIds)
                  } else {
                    activeIds = selected
                  }
                  startDrag('move', e, activeIds)
                }}
                className={`absolute cursor-move transition-shadow ${
                  isSelected
                    ? 'ring-2 ring-blue-400 bg-blue-400/20'
                    : preview
                      ? 'bg-transparent'
                      : 'ring-1 ring-red-400/60 bg-red-400/10 hover:bg-red-400/20'
                }`}
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                  width: `${f.w}%`,
                  height: `${f.h}%`,
                }}
              >
                <span
                  className={`absolute inset-0 px-1 overflow-hidden ${isLongText ? 'whitespace-pre-wrap' : 'flex items-center whitespace-nowrap'}`}
                  style={{
                    fontSize: Math.max(6, (f.fontSize ?? 10) * zoom * 2.5),
                    textAlign: f.align ?? 'left',
                    justifyContent: !isLongText ? (f.align === 'center' ? 'center' : f.align === 'right' ? 'flex-end' : 'flex-start') : undefined,
                    fontWeight: f.bold ? 700 : 400,
                    color: preview ? '#1a1a1a' : 'white',
                    fontFamily: preview ? 'Georgia, serif' : 'monospace',
                    lineHeight: 1.3,
                  }}
                >
                  {displayText}
                </span>

                {/* Resize handle */}
                {isSelected && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-400 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      startDrag('resize-br', e)
                    }}
                  />
                )}
              </div>
            )
          })}
          {/* Skill grid overlays */}
          {grids.map((g) => {
            const isSelected = selected.has(g.id)
            return (
              <div
                key={g.id}
                onClick={(e) => handleFieldClick(g.id, e)}
                onMouseDown={(e) => {
                  const multiKey = e.shiftKey || e.ctrlKey || e.metaKey
                  if (multiKey) {
                    e.stopPropagation()
                    e.preventDefault()
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (next.has(g.id)) next.delete(g.id)
                      else next.add(g.id)
                      return next
                    })
                    return
                  }
                  let activeIds: Set<string>
                  if (!selected.has(g.id)) {
                    activeIds = new Set([g.id])
                    setSelected(activeIds)
                  } else {
                    activeIds = selected
                  }
                  startDrag('move', e, activeIds)
                }}
                className={`absolute cursor-move ${
                  isSelected
                    ? 'ring-2 ring-green-400 bg-green-400/10'
                    : 'ring-1 ring-green-400/40 bg-green-400/5'
                }`}
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  width: `${g.w}%`,
                  height: `${g.h}%`,
                }}
              >
                {/* Row lines + preview values */}
                {g.rows.map((row, ri) => {
                  const val = SAMPLE_DATA[`skill:${row.skillId}`]
                  const numVal = val ? parseInt(val) : 0
                  const half = Math.floor(numVal / 2)
                  const fifth = Math.floor(numVal / 5)
                  const fontSize = Math.max(4, 5.5 * zoom * 2.5)
                  const cellStyle = (leftPct: number): React.CSSProperties => ({
                    position: 'absolute',
                    left: `${leftPct}%`, width: `${g.cellW}%`,
                    top: '5%', height: '90%',
                    fontSize, fontFamily: 'Georgia, serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#1a1a1a',
                  })
                  return (
                    <div
                      key={row.skillId}
                      className="absolute w-full border-b border-green-400/20"
                      style={{
                        top: `${(ri / g.rows.length) * 100}%`,
                        height: `${(1 / g.rows.length) * 100}%`,
                      }}
                    >
                      {preview ? (
                        <>
                          {val && <span style={{ ...cellStyle(g.valueX), fontWeight: 700 }}>{val}</span>}
                          {val && numVal > 0 && <span style={cellStyle(g.halfX)}>{half}</span>}
                          {val && numVal > 0 && <span style={cellStyle(g.fifthX)}>{fifth}</span>}
                        </>
                      ) : (
                        <span
                          className="absolute text-green-300/70 truncate px-0.5"
                          style={{
                            fontSize: Math.max(4, 5 * zoom * 2.5),
                            top: '5%', height: '90%',
                            display: 'flex', alignItems: 'center',
                          }}
                        >{row.skillId.replace(/:_open\d/, ':(…)')}</span>
                      )}
                    </div>
                  )
                })}

                {/* Sub-column markers (visible when selected) */}
                {isSelected && (
                  <>
                    <div className="absolute top-0 bottom-0 w-px bg-blue-400/60" style={{ left: `${g.valueX}%` }} />
                    <div className="absolute top-0 bottom-0 w-px bg-blue-400/60" style={{ left: `${g.halfX}%` }} />
                    <div className="absolute top-0 bottom-0 w-px bg-blue-400/60" style={{ left: `${g.fifthX}%` }} />
                  </>
                )}

                {/* Resize handle */}
                {isSelected && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      startDrag('resize-br', e)
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Marquee selection rectangle */}
          {marquee && marquee.w > 0.3 && (
            <div
              className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10 pointer-events-none"
              style={{
                left: `${marquee.x}%`, top: `${marquee.y}%`,
                width: `${marquee.w}%`, height: `${marquee.h}%`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
