import {execFileSync} from 'node:child_process';
execFileSync('npm',['ci','--prefix','study-map','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
execFileSync('node',['study-map/build.mjs'],{stdio:'inherit'});
