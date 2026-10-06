import {execFileSync} from 'node:child_process';
// O ambiente de produção também precisa do compilador durante o build, nunca no cliente.
execFileSync('npm',['ci','--prefix','study-map','--include=dev','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
execFileSync('node',['study-map/build.mjs'],{stdio:'inherit'});
