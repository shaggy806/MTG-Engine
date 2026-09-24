import { defineCard } from "../define.js";

// #75 in top-commanders.txt.
//
// - "Lands you control enter untapped" is an `others-enter-battlefield`
//   replacement with `untapped`. It beats every "enters tapped" — the land's
//   own (you order the two replacements, so you can always apply this one
//   last), another permanent's, and an effect's "put it onto the battlefield
//   tapped" — and a shock land isn't asked for its life at all (the
//   rulings). It never reaches a land entering at the same time as the
//   Minstrel, which still enters tapped.
// - The Minstrel's Ballad is an intervening-if (rule 603.4), checked as it
//   triggers and again on resolution.
// - X is counted once, as the last ability resolves, and is fixed after that.
const LANDS_TEXT = "Lands you control enter untapped.";
const BALLAD_TEXT =
  "The Minstrel's Ballad — At the beginning of combat on your turn, if you control five or " +
  "more Towns, create a 2/2 Elemental creature token that's all colors.";
const PUMP_TEXT =
  "{3}{W}{U}{B}{R}{G}: Other creatures you control get +X/+X until end of turn, where X is " +
  "the number of Towns you control.";
const TOWNS = { countOf: { subtype: "Town", controlledBy: "you" } } as const;

export default defineCard({
  name: "The Wandering Minstrel",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Bard"],
  power: 1,
  toughness: 3,
  text: `${LANDS_TEXT}\n${BALLAD_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "land", controlledBy: "you" },
        untapped: true,
      },
      text: LANDS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: {
        kind: "controls",
        filter: { subtype: "Town", controlledBy: "you" },
        atLeast: 5,
      },
      targets: [],
      effect: { kind: "create-token", token: "Elemental Token (All Colors)", count: 1 },
      resolve: null,
      text: BALLAD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{W}{U}{B}{R}{G}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: TOWNS,
        toughness: TOWNS,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
