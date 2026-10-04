import { defineCard } from "../define.js";

// EDHREC rank 5739.
//
// Rulings:
//   [2023-06-16] Reducing a creature's power after it has blocked Legolas Greenleaf will not
//     remove that blocking creature from combat or make Legolas Greenleaf unblocked.
//   [2023-06-16] If Legolas Greenleaf enters the battlefield at the same time as another legendary
//     creature you control, Legolas's Greenleaf's third ability will trigger and put a +1/+1
//     counter on it.
//
// The evasion is Steel Leaf Champion's block filter, asked only as blockers
// are declared (the first ruling).

const EVASION_TEXT = "Legolas can't be blocked by creatures with power 2 or less.";
const GROW_TEXT = "Whenever another legendary creature you control enters, put a +1/+1 counter on Legolas.";
const DRAW_TEXT = "Whenever Legolas deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Legolas Greenleaf",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 2,
  toughness: 2,
  keywords: ["reach"],
  text: `Reach\n${EVASION_TEXT}\n${GROW_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      cantBeBlockedBy: { power: { op: "lte", n: 2 } },
      text: EVASION_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { supertype: "legendary", type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
