import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// The second ability's sacrifice cost is a real choice, so it isn't a mana
// ability — it resolves on the stack like Ashnod's Altar (AUTHORING §8).
export default defineCard({
  name: "Phyrexian Tower",
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}, Sacrifice a creature: Add {B}{B}.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice a creature: Add {B}{B}.",
    },
  ],
});
