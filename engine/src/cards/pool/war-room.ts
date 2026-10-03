import { defineCard } from "../define.js";

// The life is read off `PlayerState.commanderIdentity` as the ability is
// activated (`AbilityLifeCost`): none for a colourless commander, and no
// activation at all without a commander (the rulings).
export default defineCard({
  name: "War Room",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{3}, {T}, Pay life equal to the number of colors in your commanders' color identity: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true, payLife: "commander-identity-colors" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, {T}, Pay life equal to the number of colors in your commanders' color identity: Draw a card.",
    },
  ],
});
