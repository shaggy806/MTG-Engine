import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// #300 in top-commander-cards.txt, and the pool's first Desert — authored with
// Hazezon, Shaper of Sand, whose graveyard permission and token trigger both
// key on the land type. "Sacrifice a Desert" is a filtered sacrifice cost, and
// Scavenger Grounds is a Desert itself, so it can pay with itself (it's among
// the choices, as the card allows) or keep itself and give up another.
export default defineCard({
  name: "Scavenger Grounds",
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{2}, {T}, Sacrifice a Desert: Exile all graveyards.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true, sacrifice: { filter: { subtype: "Desert" } } },
      targets: [],
      effect: { kind: "exile-graveyard", target: "each-player" },
      resolve: null,
      text: "{2}, {T}, Sacrifice a Desert: Exile all graveyards.",
    },
  ],
});
