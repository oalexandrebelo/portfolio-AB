// HTML próprio: não herda pixels, analytics ou metadados públicos da LP.
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const revalidate=0;
export const maxDuration=15;
export {GET,POST,HEAD} from "@/lib/estudos/handler";
