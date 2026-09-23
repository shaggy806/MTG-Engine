import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Ash Barrens",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "Basic landcycling {1} ({1}, Discard this card: Search your library for a basic land card, " +
    "reveal it, put it into your hand, then shuffle.)",
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
  cycling: { cost: "{1}", search: { supertype: "basic", type: "land" } },
});
