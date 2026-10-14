import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onCancel();
      }}
    >
      <DialogContent
        className="confirm-dialog-content"
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <style>{confirmStyle}</style>
        <DialogHeader>
          <DialogTitle className="confirm-dialog-title">{title}</DialogTitle>
          <DialogDescription className="confirm-dialog-desc">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="confirm-dialog-footer">
          <button
            type="button"
            className="confirm-dialog-btn ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-dialog-btn ${danger ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Aguarde..." : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const confirmStyle = `
  .confirm-dialog-content {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 14px !important;
    padding: 1.35rem 1.35rem 1.2rem !important;
    max-width: 420px !important;
    gap: 1rem !important;
  }

  .confirm-dialog-title {
    font-family: 'Sora', 'Inter', sans-serif;
    font-size: 1.1rem !important;
    font-weight: 700 !important;
    color: #0f172a !important;
  }

  .confirm-dialog-desc {
    color: #64748b !important;
    font-size: 0.9rem !important;
    line-height: 1.5 !important;
    margin-top: 0.35rem;
  }

  .confirm-dialog-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    gap: 0.55rem !important;
    margin-top: 0.35rem;
  }

  .confirm-dialog-btn {
    border-radius: 999px;
    padding: 0.55rem 1rem;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .confirm-dialog-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .confirm-dialog-btn.ghost {
    background: #fff;
    color: #334155;
    border-color: #cbd5e1;
  }

  .confirm-dialog-btn.primary {
    background: #2563eb;
    color: #fff;
  }

  .confirm-dialog-btn.danger {
    background: #dc2626;
    color: #fff;
  }
`;
