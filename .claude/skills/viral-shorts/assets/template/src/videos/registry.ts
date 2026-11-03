import type { VideoDefinition } from "../lib/types";
// `npm run new -- <slug>` adiciona as linhas abaixo automaticamente.
import { video as exemploVasoSanitario } from "./exemplo-vaso-sanitario";
import { video as exemploGelo3d } from "./exemplo-gelo-3d";
// @registry-imports

export const videos: VideoDefinition[] = [
  exemploVasoSanitario,
  exemploGelo3d,
  // @registry-entries
];
