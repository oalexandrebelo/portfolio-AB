import {brotliDecompressSync} from 'node:zlib';
import {CENSUS_B64} from './census.generated';
let cached:unknown;
/** Esta camada pública de origem é incorporada ao estudo apenas no servidor autenticado. */
export function censusData():unknown{
 if(cached)return cached;
 const value=JSON.parse(brotliDecompressSync(Buffer.from(CENSUS_B64,'base64'),{maxOutputLength:5000000}).toString('utf8'));
 if(value.schema!==1||value.referenceYear!==2022||value.collection?.features?.length!==470)throw new Error('CENSUS_INVALID');
 cached=value;return value;
}
