import { useRef } from 'react';

// QR code for https://opcourts.vercel.app (25x25 squares, with 3 squares of white around it). If the address changes, regenerate this path.
const PATH = 'M0 0h7v1h-7zM8 0h1v1h-1zM10 0h1v1h-1zM12 0h1v1h-1zM14 0h1v1h-1zM16 0h1v1h-1zM18 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM9 1h5v1h-5zM18 1h1v1h-1zM24 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h3v1h-3zM13 2h1v1h-1zM15 2h1v1h-1zM18 2h1v1h-1zM20 2h3v1h-3zM24 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h3v1h-3zM12 3h3v1h-3zM18 3h1v1h-1zM20 3h3v1h-3zM24 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM11 4h2v1h-2zM14 4h2v1h-2zM18 4h1v1h-1zM20 4h3v1h-3zM24 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h2v1h-2zM13 5h2v1h-2zM18 5h1v1h-1zM24 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h7v1h-7zM10 7h1v1h-1zM12 7h1v1h-1zM15 7h1v1h-1zM0 8h4v1h-4zM6 8h1v1h-1zM8 8h1v1h-1zM10 8h2v1h-2zM14 8h1v1h-1zM17 8h1v1h-1zM20 8h3v1h-3zM24 8h1v1h-1zM2 9h1v1h-1zM4 9h2v1h-2zM8 9h1v1h-1zM10 9h1v1h-1zM12 9h1v1h-1zM14 9h1v1h-1zM16 9h2v1h-2zM19 9h1v1h-1zM23 9h1v1h-1zM1 10h1v1h-1zM3 10h1v1h-1zM6 10h6v1h-6zM13 10h2v1h-2zM17 10h1v1h-1zM19 10h1v1h-1zM0 11h2v1h-2zM3 11h3v1h-3zM7 11h4v1h-4zM13 11h1v1h-1zM20 11h3v1h-3zM1 12h3v1h-3zM6 12h1v1h-1zM9 12h2v1h-2zM13 12h6v1h-6zM20 12h1v1h-1zM22 12h3v1h-3zM1 13h1v1h-1zM4 13h1v1h-1zM7 13h2v1h-2zM12 13h1v1h-1zM14 13h7v1h-7zM24 13h1v1h-1zM1 14h4v1h-4zM6 14h1v1h-1zM9 14h2v1h-2zM16 14h1v1h-1zM20 14h1v1h-1zM22 14h2v1h-2zM0 15h1v1h-1zM2 15h1v1h-1zM5 15h1v1h-1zM8 15h2v1h-2zM12 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM19 15h2v1h-2zM24 15h1v1h-1zM3 16h2v1h-2zM6 16h1v1h-1zM9 16h1v1h-1zM11 16h3v1h-3zM16 16h9v1h-9zM8 17h1v1h-1zM11 17h3v1h-3zM15 17h2v1h-2zM20 17h1v1h-1zM22 17h1v1h-1zM24 17h1v1h-1zM0 18h7v1h-7zM14 18h1v1h-1zM16 18h1v1h-1zM18 18h1v1h-1zM20 18h1v1h-1zM22 18h3v1h-3zM0 19h1v1h-1zM6 19h1v1h-1zM9 19h1v1h-1zM11 19h1v1h-1zM15 19h2v1h-2zM20 19h1v1h-1zM24 19h1v1h-1zM0 20h1v1h-1zM2 20h3v1h-3zM6 20h1v1h-1zM9 20h1v1h-1zM14 20h1v1h-1zM16 20h6v1h-6zM24 20h1v1h-1zM0 21h1v1h-1zM2 21h3v1h-3zM6 21h1v1h-1zM8 21h4v1h-4zM13 21h1v1h-1zM17 21h2v1h-2zM20 21h5v1h-5zM0 22h1v1h-1zM2 22h3v1h-3zM6 22h1v1h-1zM8 22h2v1h-2zM11 22h1v1h-1zM15 22h1v1h-1zM17 22h2v1h-2zM20 22h1v1h-1zM22 22h2v1h-2zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h2v1h-2zM11 23h3v1h-3zM15 23h1v1h-1zM17 23h2v1h-2zM20 23h1v1h-1zM22 23h1v1h-1zM0 24h7v1h-7zM8 24h2v1h-2zM11 24h3v1h-3zM17 24h1v1h-1zM19 24h6v1h-6z';

const Code = () => (
  <svg viewBox="-3 -3 31 31" shapeRendering="crispEdges" aria-hidden="true">
    <path fill="#fff" d="M-3 -3h31v31h-31z" />
    <path fill="#000" d={PATH} />
  </svg>
);

// Phones only (hidden on wider screens in index.css). Tapping the code opens a large version to scan from farther away.
function Share() {
  const dialog = useRef(null);
  return (
    <>
      <button type="button" className="qr" onClick={() => dialog.current.showModal()}>
        <Code />
        <span>Scan to Share</span>
      </button>
      <dialog ref={dialog} className="qr-big" aria-label="Share this page" onClick={() => dialog.current.close()}>
        <Code />
        <p>opcourts.vercel.app</p>
        <button type="button">Close</button>
      </dialog>
    </>
  );
}

export default Share;
