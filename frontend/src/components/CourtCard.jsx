import { fmtRange } from '../availability';

// Chip heights by number of text lines, so every chip on a day matches the tallest.
const HEIGHTS = ['h-10', 'h-10', 'h-15', 'h-20', 'h-25', 'h-30', 'h-35'];

const COLORS = {
  open: 'bg-success/30 border-success',
  reserved: 'bg-[#ffffff]/15 text-base-content border-[#000000]',
};

function CourtCard({ label, res, hours, lines, center }) {
  const allDay = res.length === 1 && res[0][0] === hours[0] && res[0][1] === hours[1];

  return (
    <div className={`${center ? 'col-start-2 ' : ''}col-span-2 flex flex-col gap-1 min-w-0`}>
      <span className="font-bold text-lg leading-none text-center">#{label}</span>
      <div className={`card card-border ${res.length ? COLORS.reserved : COLORS.open}`}>
        <div className={`card-body ${HEIGHTS[Math.min(lines, 6)]} p-2 gap-0 items-center justify-center text-center break-words`}>
          {res.length === 0 ? (
            <span className="font-semibold leading-6">Available</span>
          ) : (
            <>
              <span className="font-semibold leading-6">Reserved</span>
              {allDay ? (
                <span className="text-sm leading-5">All day</span>
              ) : (
                res.map(([a, b]) => (
                  <span key={a} className="text-sm leading-5 tabular-nums">{fmtRange(a, b)}</span>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourtCard;
