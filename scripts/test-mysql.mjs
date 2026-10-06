import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,['--env-file=.env.local','--import','tsx','tests/auth.ts'],{stdio:'inherit',env:{...process.env,AUTH_TEST_MYSQL:'1'},windowsHide:true});
process.exitCode=result.status ?? 1;
