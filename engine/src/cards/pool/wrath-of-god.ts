import { defineCard } from "../define.js";

export default defineCard({
  name: "Wrath of God",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures. They can't be regenerated.",
  effect: { kind: "destroy-all", filter: { type: "creature" }, cantBeRegenerated: true },
});
