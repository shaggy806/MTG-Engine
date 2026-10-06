import { defineCard } from "../define.js";

// EDHREC rank 6475.
//
// One instruction: everything matching goes at once.
export default defineCard({
  name: "Akroma's Vengeance",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all artifacts, creatures, and enchantments.\nCycling {3} ({3}, Discard this card: Draw a card.)",
  effect: { kind: "destroy-all", filter: { typesAnyOf: ["artifact", "creature", "enchantment"] } },
  cycling: { cost: "{3}" },
});
