import { defineCard } from "../define.js";

// The creature card the Spirit costs is picked as the ability goes on the
// stack.
const SPIRIT_TEXT =
  "{W}{U}, {T}, Exile a creature card from your graveyard: Create a 1/1 white Spirit creature token with flying.";

export default defineCard({
  name: "Moorland Haunt",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${SPIRIT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{W}{U}", tap: true, exileFromGraveyard: { count: 1, filter: { type: "creature" } } },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: SPIRIT_TEXT,
    },
  ],
});
