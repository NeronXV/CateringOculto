import {createPortal} from 'react-dom';
import type {QuoteReceipt} from '../../types/quote';
import type {ItineraryReceipt} from '../../types/itinerary';
import {receiptText} from '../../utils/receipt';
import './Receipt.css';
export function Receipt({receipt}:{receipt:QuoteReceipt | ItineraryReceipt}) {
  const text=receiptText(receipt);
  return <><details className="receipt-details"><summary>Ver presupuesto completo y condiciones</summary><pre>{text}</pre></details>
    <button type="button" className="btn btn-secondary" onClick={()=>window.print()}>Imprimir / guardar PDF</button>
    {createPortal(<section className="receipt-print"><h1>Catering Oculto</h1><h2>Solicitud de presupuesto</h2><pre>{text}</pre></section>,document.body)}
  </>;
}
