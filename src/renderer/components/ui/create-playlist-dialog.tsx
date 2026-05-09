import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface CreatePlaylistDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (name: string) => Promise<void>
}

export function CreatePlaylistDialog({ open, onClose, onConfirm }: CreatePlaylistDialogProps) {
  const [name, setName] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || isBusy) return
    setIsBusy(true)
    try {
      await onConfirm(name.trim())
      setName('')
      onClose()
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-80 bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-xl p-6 shadow-modal animate-scale-in focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-primary mb-4">
            Create Playlist
          </Dialog.Title>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Playlist name"
            className="w-full h-10 px-3 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-primary placeholder:text-tertiary focus:border-[var(--accent)] focus:outline-none mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm text-secondary hover:text-primary hover:bg-[var(--surface-2)] transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isBusy || !name.trim()}
              className="px-4 py-2 rounded-md text-sm bg-[var(--accent)] text-black hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? 'Creating...' : 'Create'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
