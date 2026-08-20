import { execSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const folderName = `ibkr-wallet-report-${version}`;
const stageDir = join(root, 'release', folderName);
const zipPath = join(root, 'release', `${folderName}.zip`);

console.log('Building extension…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

console.log('Staging release files…');
rmSync(stageDir, { recursive: true, force: true });
mkdirSync(join(stageDir, 'dist'), { recursive: true });
mkdirSync(join(stageDir, 'src/content'), { recursive: true });

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
manifest.version = version;
writeFileSync(join(stageDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

cpSync(join(root, 'dist/content.js'), join(stageDir, 'dist/content.js'));
cpSync(join(root, 'src/content/button.css'), join(stageDir, 'src/content/button.css'));
cpSync(join(root, 'INSTALL.md'), join(stageDir, 'INSTALL.md'));

writeFileSync(
  join(stageDir, 'LEIA-ME.txt'),
  `IBKR Wallet Report v${version}\n\nAbra INSTALL.md nesta pasta para instalar no seu navegador.\nOpen INSTALL.md in this folder for browser setup steps.\n`,
);

console.log('Creating zip…');
rmSync(zipPath, { force: true });
execSync(`zip -r "${zipPath}" "${folderName}"`, { cwd: join(root, 'release'), stdio: 'inherit' });

console.log(`\nDone.\n  Folder: release/${folderName}/\n  Zip:    release/${folderName}.zip\n`);
