import { defineCard } from "../define.js";

// #183 in top-commanders.txt.
//
// Two targets, an opponent and up to one creature you control. If the
// opponent has become an illegal target by the time it resolves, control
// doesn't change but the creature still gets everything else (rule 608.2b);
// the goad is its controller's, whoever ends up controlling the creature.
const END_STEP_TEXT =
  "At the beginning of your end step, target opponent gains control of up to one target creature you control. " +
  "Put two +1/+1 counters on it and tap it. It's goaded for the rest of the game and it gains \"This creature " +
  "can't be sacrificed.\" (It attacks each combat if able and attacks a player other than you if able.)";
const DRAW_TEXT = "Whenever a creature you own but don't control attacks, you draw a card.";

export default defineCard({
  name: "Jon Irenicus, Shattered One",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Wizard"],
  power: 3,
  toughness: 3,
  text: `${END_STEP_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["opponent", { kind: "optional", of: "creature-you-control" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 1, who: { target: 0 }, untilEndOfTurn: false },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 2 },
          { kind: "tap", target: 1 },
          { kind: "goad", target: 1, forGame: true },
          { kind: "cant-be-sacrificed", target: 1, duration: "permanent" },
        ],
      },
      resolve: null,
      text: END_STEP_TEXT,
    },
    {
      trigger: { on: "attacks", who: "any", filter: { type: "creature", ownedBy: "you", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
