import { defineCard } from "../define.js";

export default defineCard({
  name: "Winds of Rath",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures that aren't enchanted. They can't be regenerated.",
  effect: { kind: "destroy-all", filter: { type: "creature", enchanted: false }, cantBeRegenerated: true },
});
