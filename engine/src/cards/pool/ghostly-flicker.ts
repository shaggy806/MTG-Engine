import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const ARTIFACT_CREATURE_OR_LAND: TargetSpec = {
  kind: "permanent",
  whose: "you",
  filter: { typesAnyOf: ["artifact", "creature", "land"] },
};

export default defineCard({
  name: "Ghostly Flicker",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile two target artifacts, creatures, and/or lands you control, then return those cards to the battlefield under your control.",
  targets: [ARTIFACT_CREATURE_OR_LAND, ARTIFACT_CREATURE_OR_LAND],
  // Both are exiled together and return together, under your control.
  effect: { kind: "flicker", target: [0, 1], underYourControl: true },
});
