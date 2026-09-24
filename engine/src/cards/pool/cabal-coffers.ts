import { defineCard } from "../define.js";

// A "converter": its activation cost is purely generic, so the auto-payer
// funds it from other sources whenever it nets mana. "Each Swamp you
// control" is any land with the Swamp type.
export default defineCard({
  name: "Cabal Coffers",
  colors: [],
  types: ["land"],
  text: "{2}, {T}: Add {B} for each Swamp you control.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: { countOf: { subtype: "Swamp", controlledBy: "you" } },
      },
      resolve: null,
      text: "{2}, {T}: Add {B} for each Swamp you control.",
    },
  ],
});
