import { defineCard } from "../define.js";

const BLACK = "{3}, {T}: Add {B} for each basic Swamp you control.";

// Only *basic* Swamps count — a typed dual that's a Swamp doesn't. The
// {3} makes it a mana ability the auto-payer won't fund by itself, so it's
// activated by hand.
export default defineCard({
  name: "Cabal Stronghold",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${BLACK}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: { countOf: { subtype: "Swamp", supertype: "basic", controlledBy: "you" } },
      },
      resolve: null,
      text: BLACK,
    },
  ],
});
