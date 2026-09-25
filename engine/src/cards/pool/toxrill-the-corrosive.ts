import { defineCard } from "../define.js";

// #306 in top-commanders.txt.
//
// "Creatures you don't control" are the opponents' (no player controls
// anything that isn't theirs or an opponent's). The dies trigger reads the
// creature as it last existed, slime counters and controller included.
const SLIME_TEXT = "At the beginning of each end step, put a slime counter on each creature you don't control.";
const PT_TEXT = "Creatures you don't control get -1/-1 for each slime counter on them.";
const SLUG_TEXT = "Whenever a creature you don't control with a slime counter on it dies, create a 1/1 black Slug creature token.";
const DRAW_TEXT = "{U}{B}, Sacrifice a Slug: Draw a card.";
const theirs = { type: "creature", controlledBy: "opponent" } as const;

export default defineCard({
  name: "Toxrill, the Corrosive",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Slug", "Horror"],
  power: 7,
  toughness: 7,
  text: `${SLIME_TEXT}\n${PT_TEXT}\n${SLUG_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: theirs },
      grantPtPerCount: { countersOnAffected: "slime", pt: [-1, -1] },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: { kind: "add-counter-all", filter: theirs, counter: "slime", amount: 1 },
      resolve: null,
      text: SLIME_TEXT,
    },
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { ...theirs, counters: { kind: "slime", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Slug Token", count: 1 },
      resolve: null,
      text: SLUG_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{U}{B}", tap: false, sacrifice: { filter: { subtype: "Slug" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
