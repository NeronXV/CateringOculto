import type {PoolConnection,RowDataPacket} from 'mysql2/promise';
export async function verifyAvailabilitySchema(conn:PoolConnection){
  const [columns]=await conn.query<RowDataPacket[]>("SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,COLUMN_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE,COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND ((TABLE_NAME='quote_followup' AND COLUMN_NAME IN ('availability_status','availability_document','tracking_hash')) OR (TABLE_NAME='editorial_state' AND COLUMN_NAME='response_hours'))");
  const get=(name:string)=>columns.find(column=>column.COLUMN_NAME===name);
  const status=get('availability_status'),document=get('availability_document'),token=get('tracking_hash'),hours=get('response_hours');
  if(status?.DATA_TYPE!=='varchar'||Number(status.CHARACTER_MAXIMUM_LENGTH)!==16||status.IS_NULLABLE!=='NO'||String(status.COLUMN_DEFAULT).replace(/^'|'$/g,'')!=='pending'||document?.DATA_TYPE!=='longtext'||document.IS_NULLABLE!=='YES'||token?.DATA_TYPE!=='char'||Number(token.CHARACTER_MAXIMUM_LENGTH)!==64||token.IS_NULLABLE!=='YES'||hours?.DATA_TYPE!=='int'||!hours.COLUMN_TYPE.includes('unsigned')||hours.IS_NULLABLE!=='NO'||String(hours.COLUMN_DEFAULT)!=='24')throw Error('Availability schema has unexpected column definitions.');
  const [indexes]=await conn.query<RowDataPacket[]>('SHOW INDEX FROM quote_followup');
  if(!indexes.some(index=>index.Column_name==='tracking_hash'&&Number(index.Non_unique)===0&&index.Sub_part===null&&indexes.filter(row=>row.Key_name===index.Key_name).length===1))throw Error('Availability schema needs a full unique token index.');
  const [definitions]=await conn.query<RowDataPacket[]>('SHOW CREATE TABLE quote_followup');
  const ddl=String(definitions[0]['Create Table']).replace(/`|\s/g,'').toLowerCase();
  if(!ddl.includes('json_valid(availability_document)'))throw Error('Availability schema needs JSON validation.');
}
