import {readFile,writeFile} from 'node:fs/promises';
// Migração de código auditável. Os valores das credenciais existem somente no ambiente do servidor.
const path='lib/estudos/security.ts';let text=await readFile(path,'utf8');
if(!text.includes('AB_STUDIES_ACCESS_CODES')){
 const anchor='  const ids = new Set<string>(), hashes = new Set<string>();';
 if(!text.includes(anchor))throw new Error('ACCESS_PATCH_ANCHOR');
 text=text.replace(anchor,`  const codes: unknown = JSON.parse(process.env.AB_STUDIES_ACCESS_CODES ?? '{}');
  if (!codes || typeof codes !== 'object' || Array.isArray(codes)) throw new Error('STUDIES_CONFIGURATION');
  for (const [slug, password] of Object.entries(codes)) {
    if (typeof password !== 'string' || password.length < 20 || password.length > 128) throw new Error('STUDIES_CONFIGURATION');
    const entry = input.find((value: unknown) => !!value && typeof value === 'object' && (value as Entry).slug === slug) as Entry | undefined;
    if (!entry) throw new Error('STUDIES_CONFIGURATION');
    entry.accessHash = createHmac('sha256', Buffer.from(key, 'hex')).update('ab-studies:password:v1\\0').update(password).digest('hex');
  }
`+anchor);
 text=text.replace('s: e.slug, r: e.revision, i: now','s: e.slug, r: e.revision, a: e.accessHash, i: now');
 text=text.replace('e.slug === t.s && e.revision === t.r && e.enabled','e.slug === t.s && e.revision === t.r && e.accessHash === t.a && e.enabled');
 await writeFile(path,text);
}
const testPath='scripts/studies-verify.mjs';let tests=await readFile(testPath,'utf8');
if(!tests.includes('previousCodes')){
 tests=tests.replace('const previous=process.env.AB_STUDIES_REGISTRY,testPassword=', 'const previousCodes=process.env.AB_STUDIES_ACCESS_CODES;delete process.env.AB_STUDIES_ACCESS_CODES;\n const previous=process.env.AB_STUDIES_REGISTRY,testPassword=');
 tests=tests.replace('finally{process.env.AB_STUDIES_REGISTRY=previous;}', 'finally{process.env.AB_STUDIES_REGISTRY=previous;if(previousCodes===undefined)delete process.env.AB_STUDIES_ACCESS_CODES;else process.env.AB_STUDIES_ACCESS_CODES=previousCodes;}');
 await writeFile(testPath,tests);
}
console.log('Configuração de credenciais e revogação de sessões atualizadas; nenhum segredo registrado.');
