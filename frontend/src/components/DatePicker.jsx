import { shiftDate } from '../availability';

function DatePicker({ selected, first, last, onChange }) {
  return (
    <nav className="flex justify-center" aria-label="Choose a date">
      <div className="join">
        <button
          type="button"
          className="btn join-item"
          aria-label="Previous day"
          disabled={selected <= first}
          onClick={() => onChange(shiftDate(selected, -1))}
        >
          ◀
        </button>
        <input
          type="date"
          className="input join-item w-44 text-center"
          aria-label="Date"
          min={first}
          value={selected}
          onChange={e => onChange(!e.target.value || e.target.value < first ? first : e.target.value)}
        />
        <button
          type="button"
          className="btn join-item"
          aria-label="Next day"
          disabled={selected > last}
          onClick={() => onChange(shiftDate(selected, 1))}
        >
          ▶
        </button>
      </div>
    </nav>
  );
}

export default DatePicker;
