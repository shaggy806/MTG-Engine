import { defineCard } from "../define.js";

// The second ability has mana in its own cost, which is fine here: the
// exclusion in AUTHORING §15 is about *mana* abilities, which `manaSources()`
// keeps out of the auto-payment scan. This one produces damage, not mana.
export default defineCard({
  name: "Stensia Bloodhall",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{3}{B}{R}, {T}: Stensia Bloodhall deals 2 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}{B}{R}", tap: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text:
        "{3}{B}{R}, {T}: Stensia Bloodhall deals 2 damage to target player or planeswalker.",
    },
  ],
});
