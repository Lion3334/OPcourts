import { useState, useEffect } from 'react';
import DatePicker from './components/DatePicker';
import CourtCard from './components/CourtCard';
import { sideHours, reserved, longDate } from './availability';

const PORTAL = 'https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing';

// Courts listed north to south; rows of two are centered.
const LAYOUT = {
  North: [['16', '15'], ['14', '13', '12'], ['11', '10', '9'], ['8', '7', '6'], ['5', '4', '3'], ['2', '1']],
  South: [['H', 'G'], ['F', 'E', 'D'], ['C', 'B', 'A']],
};

const todayLA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/courts.json`, { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error('Could not load court data. Try refreshing the page.');
        return r.json();
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <div className="min-h-screen flex items-center justify-center p-4 text-error text-center">{error}</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
  }

  // Data dates still in the future (an old file shouldn't offer past days).
  const today = todayLA();
  const dates = Object.keys(data.courts[0].dates).sort().filter(d => d >= today);
  const first = dates[0] ?? today;
  const last = dates[dates.length - 1] ?? today;
  const day = selected && selected >= first ? selected : first;
  const tooFar = day > last;

  const byKey = {};
  data.courts.forEach(c => { byKey[c.side + c.label] = c; });
  const hours = { North: sideHours(data.courts, 'North', day), South: sideHours(data.courts, 'South', day) };
  const res = {};
  data.courts.forEach(c => { res[c.side + c.label] = reserved(c.dates[day] || [], hours[c.side]); });
  const lines = Math.max(...Object.values(res).map(r => 1 + r.length));

  const updated = new Date(data.lastUpdated).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
  });

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-5">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-balance">OP Court Availability</h1>
          <p className="text-sm italic text-base-content/70 mt-1">Last update {updated}</p>
        </header>

        <DatePicker selected={day} first={first} last={last} onChange={setSelected} />

        <main className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold text-center">{longDate(day)}</h2>

          {tooFar ? (
            <div role="alert" className="alert alert-info alert-soft alert-vertical justify-items-center text-center">
              <div className="flex flex-col gap-1 items-center">
                <p className="font-semibold">This site shows the next two weeks, through {longDate(last, { month: 'long', day: 'numeric' })}.</p>
                <p>For later dates, check the city's reservation site directly.</p>
                <a className="link link-primary" href={PORTAL} target="_blank" rel="noopener noreferrer">
                  Open the Santa Monica Recreation portal
                </a>
              </div>
            </div>
          ) : (
            Object.entries(LAYOUT).map(([side, rows]) => (
              <section key={side} className="flex flex-col gap-3">
                <h3 className="text-lg font-bold uppercase tracking-wide text-center border-b-2 border-base-content pb-1.5">{side}</h3>
                <div className="grid grid-cols-6 gap-x-2 gap-y-3">
                  {rows.flatMap(row => row.map((label, i) => (
                    <CourtCard
                      key={label}
                      label={label}
                      res={res[side + label]}
                      hours={hours[side]}
                      lines={lines}
                      center={row.length === 2 && i === 0}
                    />
                  )))}
                </div>
              </section>
            ))
          )}
        </main>

        <footer className="text-sm text-center text-base-content/70 border-t border-base-300 pt-3">
          <p>
            Data comes from the{' '}
            <a className="link link-primary" href={PORTAL} target="_blank" rel="noopener noreferrer">
              Santa Monica Recreation portal
            </a>.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
