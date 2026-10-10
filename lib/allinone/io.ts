import {Failure} from './fault';

/** Limita bytes reais e tempo de leitura, inclusive quando o produtor para no meio do corpo. */
export async function readText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<string> {
  if (!body) throw new Failure('BODY_INVALID', 400);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let expired = false;
  let rejectDeadline!: (reason: Error) => void;
  const deadline = new Promise<never>((_, reject) => { rejectDeadline = reject; });
  const cancel = (code: string) => {
    if (expired) return;
    expired = true;
    rejectDeadline(new Failure(code, code === 'BODY_TIMEOUT' ? 408 : 400));
    // Um cancel de stream arbitrário também pode não resolver: não o aguardar no caminho crítico.
    void reader.cancel().catch(() => undefined);
  };
  const onAbort = () => cancel('BODY_ABORTED');
  const timer = setTimeout(() => cancel('BODY_TIMEOUT'), timeoutMs);
  signal?.addEventListener('abort', onAbort, {once: true});
  try {
    if (signal?.aborted) onAbort();
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (expired) throw new Failure('BODY_ABORTED', 400);
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => undefined);
        throw new Failure('BODY_LIMIT', 413);
      }
      chunks.push(part.value);
    }
    try { return new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks)); }
    catch { throw new Failure('BODY_ENCODING', 400); }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

export async function boundedRequest(req: Request, max = 16384): Promise<string> {
  const length = req.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > max)) {
    throw new Failure('BODY_LIMIT', 413);
  }
  return readText(req.body, max, 3000, req.signal);
}
