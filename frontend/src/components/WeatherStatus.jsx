import { summarizeDay, SKY_LABEL } from '../weather';

const Icon = ({ children }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const CLOUD = 'M4.5 12.5h7a3 3 0 0 0 .4-5.97A4 4 0 0 0 4.2 7.2a2.7 2.7 0 0 0 .3 5.3z';
const SKY_ICON = {
  sun: <Icon><circle cx="8" cy="8" r="2.8" /><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" /></Icon>,
  partly: <Icon><circle cx="5.2" cy="5.2" r="2" /><path d="M5.2 1.2v.9M1.2 5.2h.9M2.4 2.4l.6.6M8 2.4l-.6.6" /><path d="M6.8 13h4.6a2.4 2.4 0 0 0 .3-4.77A3.2 3.2 0 0 0 5.6 9.2 2 2 0 0 0 6.8 13z" /></Icon>,
  cloud: <Icon><path d={CLOUD} /></Icon>,
  rain: <Icon><path d="M4.5 9.5h7a2.7 2.7 0 0 0 .4-5.37A3.6 3.6 0 0 0 4.2 4.7a2.4 2.4 0 0 0 .3 4.8z" /><path d="M5.5 11.8l-.6 1.6M8.5 11.8l-.6 1.6M11.5 11.8l-.6 1.6" /></Icon>,
  storm: <Icon><path d="M4.5 9.5h7a2.7 2.7 0 0 0 .4-5.37A3.6 3.6 0 0 0 4.2 4.7a2.4 2.4 0 0 0 .3 4.8z" /><path d="M8.6 9.8l-1.7 2.4h2.3l-1 2.3" /></Icon>,
};

// Forecast for the selected day in three blocks. Shows a placeholder while loading and nothing if
// the forecast failed or doesn't reach that day, so the courts below are never held up.
function WeatherStatus({ weather, day }) {
  if (!weather) return <div className="wx loading" aria-hidden="true" />;
  const blocks = weather === 'error' ? null : summarizeDay(weather[day]);
  if (!blocks) return null;

  return (
    <section className="wx" aria-label="Weather forecast">
      {blocks.map((b, i) => b && (
        <div key={b.key} className={`wx-b${b.flags.length ? ' flag' : ''}`}>
          <div className="wx-top">
            <span className="wx-lbl">{b.label}</span>
            <span className="wx-ico" role="img" aria-label={SKY_LABEL[b.sky]}>{SKY_ICON[b.sky]}</span>
          </div>
          <div className="wx-temp">{b.hi}° / {b.lo}°</div>
          <div className="wx-meta">
            <span>{b.prob}% rain</span>
            <span>{b.gust} mph gusts</span>
          </div>
          <div className="wx-flags">
            {b.flags.map(f => <span key={f}>{f}</span>)}
          </div>
        </div>
      ))}
    </section>
  );
}

export default WeatherStatus;
