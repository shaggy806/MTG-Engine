import { defineCard } from "../define.js";

export default defineCard({
  name: "Memorial to Folly",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B}.\n{2}{B}, {T}, Sacrifice this land: Return target creature card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: "{2}{B}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{2}{B}, {T}, Sacrifice this land: Return target creature card from your graveyard to your hand.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
