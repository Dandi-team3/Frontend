import { useEffect, useId, useRef, type ReactNode } from 'react';

type FlowDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function FlowDialog({ open, title, onClose, children }: FlowDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="flow-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
