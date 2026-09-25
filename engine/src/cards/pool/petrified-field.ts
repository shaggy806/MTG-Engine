import { defineCard } from "../define.js";

export default defineCard({
  name: "Petrified Field",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}, Sacrifice this land: Return target land card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{T}, Sacrifice this land: Return target land card from your graveyard to your hand.",
    },
  ],
});
