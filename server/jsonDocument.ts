// MariaDB versions/drivers may return validated JSON columns as text or objects.
export function jsonDocument(value:unknown):any {
  if(typeof value==='string')return JSON.parse(value);
  if(value && typeof value==='object')return structuredClone(value);
  throw new Error('Documento JSON inválido.');
}
