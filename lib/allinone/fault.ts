import {randomUUID} from 'node:crypto';

/** Resultado desconhecido nunca significa rollback confirmado. */
export class Failure extends Error {
  constructor(public code: string, public status: number, public uncertain = false) {
    super(code);
    this.name = 'Failure';
  }
}

export function failureResponse(error: unknown) {
  const failure = error instanceof Failure ? error : new Failure('INTERNAL_ERROR', 500);
  return {
    status: failure.status,
    body: {error: failure.code, uncertain: failure.uncertain, request_id: randomUUID()},
  };
}
