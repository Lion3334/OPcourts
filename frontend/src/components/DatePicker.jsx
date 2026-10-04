import { shiftDate } from '../availability';

function DatePicker({ selected, first, last, onChange }) {
  return (
    <nav className="picker" aria-label="Choose a date">
      <button type="button" aria-label="Previous day" disabled={selected <= first} onClick={() => onChange(shiftDate(selected, -1))}>◀</button>
      <input
        type="date"
        aria-label="Date"
        min={first}
        value={selected}
        onChange={e => onChange(!e.target.value || e.target.value < first ? first : e.target.value)}
      />
      <button type="button" aria-label="Next day" disabled={selected > last} onClick={() => onChange(shiftDate(selected, 1))}>▶</button>
    </nav>
  );
}

export default DatePicker;
