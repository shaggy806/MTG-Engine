import { defineCard } from "../define.js";

const FORGE_TEXT =
  "{T}: Choose target commander that entered this turn. Put a +1/+1 counter on it if it's a creature and a loyalty counter on it if it's a planeswalker.";

// Any player's commander. Both checks are made as it resolves, so a creature
// planeswalker gets both counters.
export default defineCard({
  name: "Forge of Heroes",
  types: ["land"],
  text: `{T}: Add {C}.\n${FORGE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", filter: { isCommander: true, enteredThisTurn: true } }],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { type: "creature" } },
            then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { type: "planeswalker" } },
            then: { kind: "add-counter", target: 0, counter: "loyalty", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: FORGE_TEXT,
    },
  ],
});
