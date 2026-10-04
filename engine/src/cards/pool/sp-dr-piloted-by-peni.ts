import { defineCard } from "../define.js";

// EDHREC rank 6213.
//
// The draw is Araña, Heart of the Spider's "modified creature you control"
// combat-damage trigger.
const ETB_TEXT = "When SP//dr enters, put a +1/+1 counter on target creature.";
const DRAW_TEXT = "Whenever a modified creature you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "SP//dr, Piloted by Peni",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Spider", "Hero"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${ETB_TEXT}\n${DRAW_TEXT} (Equipment, Auras you control, and counters are modifications.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { modified: true } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
