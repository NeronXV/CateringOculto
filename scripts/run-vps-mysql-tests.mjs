// Run only in the isolated verification container sharing DB loopback.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['--import','tsx','tests/auth.ts'],{
  stdio:'inherit',env:{...process.env,AUTH_TEST_MYSQL:'1',DB_PORT:'3306',DB_ROOT_PASSWORD:readFileSync('/run/secrets/test_root','utf8').trim()}
});
process.exitCode=result.status ?? 1;
