import { defineCard } from "../define.js";

// EDHREC rank 3324.

const PREVENT_TEXT =
  "{W}, {T}: Prevent the next 2 damage that would be dealt to target legendary creature this turn.";

export default defineCard({
  name: "Eiganjo Castle",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {W}.\n${PREVENT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
    {
      cost: { mana: "{W}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "prevent-damage", target: 0, amount: 2 },
      resolve: null,
      text: PREVENT_TEXT,
    },
  ],
});
