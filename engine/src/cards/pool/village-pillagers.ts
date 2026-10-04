import { defineCard } from "../define.js";

// EDHREC rank 5565.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2025-11-17] Wither applies to any damage dealt to creatures by Village Pillagers. This
//     includes combat damage as well as anything that causes it to deal noncombat damage, such as
//     the effect of its second ability.
// The dying creature's controller and counters are read as it last existed on
// the battlefield (Necroskitter's shape), counters of any kind.
const ETB_TEXT = "When this creature enters, it deals 1 damage to each creature your opponents control.";
const DIES_TEXT = "Whenever a creature an opponent controls with a counter on it dies, you create a tapped Treasure token.";

export default defineCard({
  name: "Village Pillagers",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 5,
  toughness: 5,
  keywords: ["wither"],
  text: `Wither (This deals damage to creatures in the form of -1/-1 counters.)\n${ETB_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "damage-all", amount: 1, filter: { type: "creature", controlledBy: "opponent" } },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: {
        on: "dies",
        who: "opponent",
        filter: { type: "creature", counters: { compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
