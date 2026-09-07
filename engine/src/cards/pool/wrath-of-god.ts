import { defineCard } from "../define.js";

export default defineCard({
  name: "Wrath of God",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  // "They can't be regenerated" is a no-op here — regeneration isn't modeled.
  text: "Destroy all creatures. They can't be regenerated.",
  effect: { kind: "destroy-all", filter: { type: "creature" } },
});
