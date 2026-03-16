import { useState, useRef, useCallback, useEffect } from 'react'
import { CARD_LAYOUTS, type FieldBox } from '@/data/cardFieldLayouts'
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

  // ── Umiejętności (kolumny — tekst demonstracyjny) ──
  skills_col1: 'Antropologia 01%\nArcheologia 45%  22  9\nBroń Palna (Krótka) 50%  25  10\nCharakteryzacja 05%\nElektryka 10%\nGadanina 05%\nHistoria 55%  27  11\nJeździectwo 05%\nJęzyk Obcy (Łacina) 40%  20  8\nJęzyk Ojczysty 80%  40  16\nKorz. z Bibliotek 60%  30  12\nKsięgowość 05%\nMajętność 50%  25  10\nMechanika 10%',
  skills_col2: 'Medycyna 01%\nMity Cthulhu 08%  4  1\nNasłuchiwanie 20%\nNauka (Archeologia) 65%  32  13\nNauka (Historia) 45%  22  9\nNawigacja 10%\nOkultyzm 35%  17  7\nPerswazja 40%  20  8\nPierwsza Pomoc 30%\nPływanie 20%\nPrawo 05%\nProwadz. Samochodu 20%\nPsychologia 10%\nRzucanie 20%',
  skills_col3: 'Spostrzegawczość 55%  27  11\nSzt./Rzemiosło (Fotografia) 25%  12  5\nUkrywanie 20%\nUnik 30%  15  6\nUrok Osobisty 15%\nWalka Wręcz (Bijatyka) 25%\nWiedza o Naturze 10%\nWspinaczka 20%\nWycena 25%  12  5\nZastraszanie 15%\nZręczne Palce 10%',

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

type DragMode = 'move' | 'resize-br' | null

interface DragState {
  mode: DragMode
  startX: number
  startY: number
  // Snapshot of all selected fields at drag start
  originals: Map<string, { x: number; y: number; w: number; h: number }>
}

export function CardEditorPage() {
  const [layoutIdx, setLayoutIdx] = useState(0)
  const layout = CARD_LAYOUTS[layoutIdx]
  const [fields, setFields] = useState<FieldBox[]>(() => {
    const saved = loadSaved()
    return saved[layout.id] ?? layout.fields.map((f) => ({ ...f }))
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(0.3)
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Image dimensions in px (all cards are 2479x3508)
  const IMG_W = 2479
  const IMG_H = 3508

  // Switch layout
  const switchLayout = (idx: number) => {
    setLayoutIdx(idx)
    const saved = loadSaved()
    const l = CARD_LAYOUTS[idx]
    setFields(saved[l.id] ?? l.fields.map((f) => ({ ...f })))
    setSelected(new Set())
  }

  // Auto-save on field changes
  useEffect(() => {
    saveToDisk(layout.id, fields)
  }, [fields, layout.id])

  const resetToDefaults = () => {
    if (!confirm('Zresetować pozycje do domyślnych?')) return
    setFields(layout.fields.map((f) => ({ ...f })))
  }

  // --- Selection ---
  const handleFieldClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey) {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    } else {
      setSelected(new Set([id]))
    }
  }

  const handleCanvasClick = () => {
    if (!dragState) setSelected(new Set())
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
      if (f) originals.set(id, { x: f.x, y: f.y, w: f.w, h: f.h })
    }
    setDragState({ mode, startX: e.clientX, startY: e.clientY, originals })
  }

  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY
      const { dpx, dpy } = pxToPercent(dx, dy)

      setFields((prev) =>
        prev.map((f) => {
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
      )
    }

    const handleMouseUp = () => {
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
      [layout.id]: fields,
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportAllJson = () => {
    const allData: Record<string, FieldBox[]> = {}
    // For current layout, use current fields; for others, use defaults
    CARD_LAYOUTS.forEach((l, i) => {
      allData[l.id] = i === layoutIdx ? fields : l.fields
    })
    navigator.clipboard.writeText(JSON.stringify(allData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedFields = fields.filter((f) => selected.has(f.id))

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

        {/* Field list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {fields.map((f) => (
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
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-neutral-900" onClick={handleCanvasClick}>
        <div
          ref={containerRef}
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
                  let activeIds: Set<string>
                  if (!selected.has(f.id)) {
                    if (!e.shiftKey) {
                      activeIds = new Set([f.id])
                    } else {
                      activeIds = new Set([...selected, f.id])
                    }
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
        </div>
      </div>
    </div>
  )
}
