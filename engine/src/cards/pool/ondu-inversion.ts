import { defineCard } from "../define.js";

/** A modal double-faced card (sorcery // land) — its back face, Ondu
 * Skyruins, is a land you play instead. */
export default defineCard({
  name: "Ondu Inversion",
  manaCost: "{6}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all nonland permanents.",
  effect: { kind: "destroy-all", filter: { notTypes: ["land"] } },
  faces: ["Ondu Inversion", "Ondu Skyruins"],
});
