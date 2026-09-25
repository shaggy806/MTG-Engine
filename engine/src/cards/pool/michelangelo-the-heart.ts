import { defineCard } from "../define.js";

// #221 in top-commanders.txt.
//
// "Your second main phase" is the postcombat main phase that is the turn's
// second main phase; "if you attacked this turn" is the intervening-if.
const RAID_TEXT =
  "Raid (the Fridge) — At the beginning of your second main phase, if you attacked this turn, put a " +
  "+1/+1 counter on target creature and create a Food token.";

export default defineCard({
  name: "Michelangelo, the Heart",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Ninja", "Turtle"],
  power: 2,
  toughness: 1,
  keywords: ["trample"],
  pairing: { kind: "partner-group", group: "Character select" },
  text:
    `Trample\n${RAID_TEXT}\n` + "Partner—Character select (You can have two commanders if both have this ability.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      condition: {
        kind: "all",
        of: [
          { kind: "turn-structure", mainPhase: 2 },
          { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 },
        ],
      },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "create-token", token: "Food Token", count: 1 },
        ],
      },
      resolve: null,
      text: RAID_TEXT,
    },
  ],
});
