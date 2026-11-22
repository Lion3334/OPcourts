import { shiftDate, longDate } from '../availability';

// Browsers don't let a page choose how a date box words its date, so our label sits under an invisible one.
// Touch devices open their own picker on tap; with a mouse it has to be opened by hand.
const openPicker = e => { if (matchMedia('(pointer: fine)').matches) e.target.showPicker?.(); };

function DatePicker({ selected, first, last, onChange }) {
  return (
    <nav className="picker" aria-label="Choose a date">
      <button type="button" aria-label="Previous day" disabled={selected <= first} onClick={() => onChange(shiftDate(selected, -1))}>◀</button>
      <div className="date">
        <span aria-hidden="true">{longDate(selected, { weekday: 'long' })} {selected.slice(5).replace('-', '/')}</span>
        <input
          type="date"
          aria-label="Date"
          min={first}
          value={selected}
          onClick={openPicker}
          onChange={e => onChange(!e.target.value || e.target.value < first ? first : e.target.value)}
        />
      </div>
      <button type="button" aria-label="Next day" disabled={selected > last} onClick={() => onChange(shiftDate(selected, 1))}>▶</button>
    </nav>
  );
}

export default DatePicker;
