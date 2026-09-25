import { defineCard } from "../define.js";

// #490 in top-commanders.txt.
//
// The experience counter is a delayed trigger keyed to that creature dying
// this turn, set up only if it's still on the battlefield as the ability
// resolves.
const PT_TEXT = "Kelsien gets +1/+1 for each experience counter you have.";
const PING_TEXT =
  "{T}: Kelsien deals 1 damage to target creature you don't control. When that creature dies this " +
  "turn, you get an experience counter.";

export default defineCard({
  name: "Kelsien, the Plague",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance", "haste"],
  text: `Vigilance, haste\n${PT_TEXT}\n${PING_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { playerCounters: "experience", pt: [1, 1] },
      text: PT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "delayed-trigger",
            at: { leaves: 0, to: ["graveyard"], thisTurn: true },
            effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
            text: "When that creature dies this turn, you get an experience counter.",
          },
          { kind: "damage", amount: 1, target: 0 },
        ],
      },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
