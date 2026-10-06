import session from 'express-session';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import {jsonDocument} from './jsonDocument';
export class MysqlSessions extends session.Store {
  constructor(private pool: Pool) {super();}
  get(sid: string, callback: (error: unknown, value?: session.SessionData | null)=>void) {
    this.pool.execute<RowDataPacket[]>('SELECT document FROM staff_sessions WHERE sid=? AND expires_at>?',[sid,Date.now()])
      .then(([rows])=>callback(null,rows.length ? jsonDocument(rows[0].document) : null)).catch(callback);
  }
  set(sid: string, data: session.SessionData, callback?: (error?: unknown)=>void) {
    const expires = data.cookie.expires ? new Date(data.cookie.expires).getTime() : Date.now()+8*60*60*1000;
    this.pool.execute('INSERT INTO staff_sessions (sid,expires_at,document) VALUES (?,?,?) ON DUPLICATE KEY UPDATE expires_at=VALUES(expires_at),document=VALUES(document)',[sid,expires,JSON.stringify(data)])
      .then(()=>callback?.()).catch(error=>callback?.(error));
  }
  destroy(sid: string, callback?: (error?: unknown)=>void) {
    this.pool.execute('DELETE FROM staff_sessions WHERE sid=?',[sid]).then(()=>callback?.()).catch(error=>callback?.(error));
  }
}
