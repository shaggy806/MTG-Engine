import { defineCard } from "../define.js";

// X counts the creatures attacking you as it resolves — not a planeswalker
// of yours (rule 506.3). The prevention isn't locked in: it stops combat
// damage from whatever isn't a Spider as that damage would be dealt (rule
// 615.1), for the rest of the turn.
const TEXT =
  "Create X 1/2 green Spider creature tokens with reach, where X is the number of creatures attacking you. Prevent all combat damage that would be dealt this turn by non-Spider creatures.";

export default defineCard({
  name: "Arachnogenesis",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "1/2 Green Spider Token (Reach)", count: { attackingPlayer: "each" } },
      { kind: "prevent-all-combat-damage", by: { type: "creature", notSubtypes: ["Spider"] } },
    ],
  },
});
