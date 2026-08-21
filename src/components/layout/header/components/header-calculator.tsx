import { LUIIcon } from '../../../ui/icon/icon';

/* Placeholder trigger — the calculator widget is wired up later. */
export function HeaderCalculator() {
  return (
    <button type="button" className="header-icon-button" aria-label="Calculator">
      <LUIIcon name="calculator" size={18} />
    </button>
  );
}
