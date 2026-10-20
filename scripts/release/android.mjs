import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const required = ['PILGRIM_UPLOAD_STORE_FILE', 'PILGRIM_UPLOAD_STORE_PASSWORD',
  'PILGRIM_UPLOAD_KEY_ALIAS', 'PILGRIM_UPLOAD_KEY_PASSWORD'];
if (required.some(key => !process.env[key]?.trim()) ||
    !existsSync(process.env.PILGRIM_UPLOAD_STORE_FILE)) {
  throw new Error('Load the private signing.env with Node --env-file before building.');
}
for (const [command, args, cwd] of [
  ['npm', ['run', 'build'], root],
  [process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android'], root],
  ['./gradlew', ['--no-daemon', '--max-workers=2', 'bundleRelease', 'assembleRelease'], `${root}android`],
]) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
