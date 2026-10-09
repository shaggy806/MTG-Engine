import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 1292.
//
// Dredge (rule 702.52) is `CardDefinition.dredge` — Life from the Loam's: it
// replaces any draw, one at a time, and isn't offered with fewer than two
// cards in the library (the rulings). A land in the graveyard dredges like
// any other card.
export default defineCard({
  name: "Dakmor Salvage",
  colors: [],
  types: ["land"],
  dredge: 2,
  text:
    "This land enters tapped.\n{T}: Add {B}.\n" +
    "Dredge 2 (If you would draw a card, you may mill two cards instead. If you do, return this card from your graveyard to your hand.)",
  activated: [addManaAbility({ mana: "B", text: "{T}: Add {B}." })],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
