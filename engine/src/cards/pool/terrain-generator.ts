import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Terrain Generator",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{2}, {T}: You may put a basic land card from your hand onto the battlefield tapped.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { supertype: "basic", type: "land" },
        enterTapped: true,
      },
      resolve: null,
      text: "{2}, {T}: You may put a basic land card from your hand onto the battlefield tapped.",
    },
  ],
});
