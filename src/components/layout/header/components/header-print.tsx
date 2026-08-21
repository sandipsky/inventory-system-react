import { LUIIcon } from '../../../ui/icon/icon';

export function HeaderPrint() {
  return (
    <button
      type="button"
      className="header-icon-button"
      aria-label="Print"
      onClick={() => window.print()}
    >
      <LUIIcon name="print" size={18} />
    </button>
  );
}
