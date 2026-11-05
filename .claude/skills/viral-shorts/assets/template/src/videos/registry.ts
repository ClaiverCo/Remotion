import type { VideoDefinition } from "../lib/types";
// `npm run new -- <slug>` adiciona as linhas abaixo automaticamente.
import { video as exemploVasoSanitario } from "./exemplo-vaso-sanitario";
import { video as exemploGelo3d } from "./exemplo-gelo-3d";
import { video as stickmanHouseKey } from "./stickman-house-key";
import { video as stickmanElectricFan } from "./stickman-electric-fan";
import { video as stickmanStuck01Crystal } from "./stickman-stuck-01-crystal";
import { video as stickmanStuck02Battery } from "./stickman-stuck-02-battery";
import { video as stickmanStuck03Chip } from "./stickman-stuck-03-chip";
import { video as stickmanStuck04Gps } from "./stickman-stuck-04-gps";
import { video as stickmanStuck01CrystalPt } from "./stickman-stuck-01-crystal-pt";
import { video as stickmanStuck02BatteryPt } from "./stickman-stuck-02-battery-pt";
import { video as stickmanStuck03ChipPt } from "./stickman-stuck-03-chip-pt";
// @registry-imports

export const videos: VideoDefinition[] = [
  exemploVasoSanitario,
  exemploGelo3d,
  stickmanHouseKey,
  stickmanElectricFan,
  stickmanStuck01Crystal,
  stickmanStuck02Battery,
  stickmanStuck03Chip,
  stickmanStuck04Gps,
  stickmanStuck01CrystalPt,
  stickmanStuck02BatteryPt,
  stickmanStuck03ChipPt,
  // @registry-entries
];
