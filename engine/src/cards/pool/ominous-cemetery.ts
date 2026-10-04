import { defineCard } from "../define.js";

// EDHREC rank 6050.

export default defineCard({
  name: "Ominous Cemetery",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{5}, {T}, Exile this land: Target creature's owner shuffles it into their library.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{5}", tap: true, exileSelf: true },
      targets: ["creature"],
      effect: { kind: "shuffle-into-library", target: 0 },
      resolve: null,
      text: "{5}, {T}, Exile this land: Target creature's owner shuffles it into their library.",
    },
  ],
});
