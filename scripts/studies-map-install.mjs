import {execFileSync} from 'node:child_process';
// Ferramentas de construção são instaladas no build, não no cliente.
execFileSync('npm',['ci','--prefix','study-map','--include=dev','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/studies-census-prepare.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','study-map/tsconfig.json'],{stdio:'inherit'});
execFileSync(process.execPath,['study-map/analytics.test.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['study-map/build.mjs'],{stdio:'inherit'});
