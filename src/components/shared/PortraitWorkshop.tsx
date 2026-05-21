import { Card } from '@/components/ui/Card'
import { GeneratePortraitPanel, type EnhancePromptArgs } from '@/components/player/GeneratePortraitPanel'
import { PortraitEditor } from '@/components/player/PortraitEditor'
import type { CharacterSheetData } from '@/components/shared/CharacterSheet'
import type { PortraitCropData } from '@/types/character'

interface PortraitWorkshopProps {
  character: CharacterSheetData
  onSetProfilePortrait: (publicUrl: string) => Promise<void>
  onSetCardPortrait: (publicUrl: string, cropData: PortraitCropData) => Promise<void>
  onEnhancePrompt: (args: EnhancePromptArgs) => Promise<{ enhancedPrompt: string }>
}

export function PortraitWorkshop({
  character,
  onSetProfilePortrait,
  onSetCardPortrait,
  onEnhancePrompt,
}: PortraitWorkshopProps) {
  return (
    <>
      <Card>
        <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider mb-3">
          Generator promptu
        </h4>
        <GeneratePortraitPanel
          character={character}
          onEnhancePrompt={onEnhancePrompt}
        />
      </Card>
      <PortraitEditor
        character={character}
        onSetProfilePortrait={onSetProfilePortrait}
        onSetCardPortrait={onSetCardPortrait}
      />
    </>
  )
}
