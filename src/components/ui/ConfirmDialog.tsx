import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          danger ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <AlertTriangle
            size={22}
            className={danger ? 'text-red-500' : 'text-amber-500'}
          />
        </div>
        <div>
          <p className="font-display font-semibold text-surface-800">{title}</p>
          <p className="text-surface-500 text-sm mt-1">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
} 