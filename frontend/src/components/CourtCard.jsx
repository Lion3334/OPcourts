import { fmtRange } from '../availability';

// Day timeline drawn like a sparkline: low when open, raised while reserved.
// It covers 8am–5pm only, inset 15% from each card edge so the rounded corners don't hide the ends.
const T0 = 480, T1 = 1020;
const TICKS = [[480, '8am'], [720, '12pm'], [1020, '5pm']];
const X = m => 15 + ((m - T0) / (T1 - T0)) * 70;
const LOW = 20, HIGH = 6;

function Spark({ res }) {
  let d = `M${X(T0)} ${LOW}`;
  res.map(([a, b]) => [Math.max(a, T0), Math.min(b, T1)]).filter(([a, b]) => b > a).forEach(([a, b]) => {
    d += ` L${X(a)} ${LOW} L${X(a)} ${HIGH} L${X(b)} ${HIGH} L${X(b)} ${LOW}`;
  });
  d += ` L${X(T1)} ${LOW}`;
  return (
    <>
      <svg className="spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${d} L${X(T1)} 24 L${X(T0)} 24 Z`} fill={`url(#${res.length ? 'g-res' : 'g-ok'})`} />
        {TICKS.map(([m]) => <path key={m} className="tick" d={`M${X(m)} 17.5 V22.5`} />)}
        <path className="line" d={d} />
      </svg>
      <div className="hrs" aria-hidden="true">
        {TICKS.map(([m, l]) => <span key={m} style={{ left: `${X(m)}%` }}>{l}</span>)}
      </div>
    </>
  );
}

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
);
const CautionIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.13 2.5a1 1 0 0 1 1.74 0l5.4 9.5a1 1 0 0 1-.87 1.5H2.6a1 1 0 0 1-.87-1.5z" /><path d="M8 6.3v3" /><path d="M8 11.4h.01" />
  </svg>
);

function CourtCard({ side, label, res, hours, center }) {
  const ok = res.length === 0;
  const allDay = res.length === 1 && res[0][0] === hours[0] && res[0][1] === hours[1];

  return (
    <div className={`cell${center ? ' center' : ''}`} data-court={side + label}>
      <article className={`court ${ok ? 'ok' : 'res'}`}>
        <div className="top">
          <span className="lbl">{ok ? 'Available' : 'Reserved'}</span>
          <span className="ico">{ok ? <CheckIcon /> : <CautionIcon />}</span>
        </div>
        <div className="num">#{label}</div>
        <div className="times">
          {!ok && (allDay ? <span>All day</span> : res.map(([a, b]) => <span key={a}>{fmtRange(a, b)}</span>))}
        </div>
        <Spark res={res} />
      </article>
    </div>
  );
}

export default CourtCard;
