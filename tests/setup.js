import { readFileSync } from 'fs';
import { join } from 'path';
const src = readFileSync(join(process.cwd(), 'js', 'app.js'), 'utf8');
// eslint-disable-next-line no-new-func
new Function('window', src)(globalThis);
