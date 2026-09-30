import { defineCard } from "../define.js";

const TEXT =
  "Whenever Drana deals combat damage to a player, put a +1/+1 counter on each attacking creature you control.";

// After first-strike damage, so the counters count for the creatures that
// deal regular damage (its ruling); only attackers still there get one.
export default defineCard({
  name: "Drana, Liberator of Malakir",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Ally"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "first-strike"],
  text: `Flying, first strike\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you", attacking: true },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
