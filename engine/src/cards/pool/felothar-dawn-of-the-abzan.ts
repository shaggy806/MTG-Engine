import { defineCard } from "../define.js";

const TEXT =
  "Whenever Felothar enters or attacks, you may sacrifice a nonland permanent. When you do, put a +1/+1 " +
  "counter on each creature you control.";
const WHEN_YOU_DO = "When you do, put a +1/+1 counter on each creature you control.";

// "When you do" is a reflexive ability (rule 603.12), on the stack once the
// sacrifice is made; it counts the creatures you control as it resolves.
// Felothar itself may be the permanent sacrificed.
const effect = {
  kind: "each-player-may",
  who: "you",
  options: [{ sacrifice: { notTypes: ["land"] }, text: "Sacrifice a nonland permanent" }],
  ifDid: {
    kind: "reflexive-trigger",
    targets: [],
    effect: {
      kind: "add-counter-all",
      filter: { type: "creature", controlledBy: "you" },
      counter: "+1/+1",
      amount: 1,
    },
    text: WHEN_YOU_DO,
  },
} as const;

export default defineCard({
  name: "Felothar, Dawn of the Abzan",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect, resolve: null, text: TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect, resolve: null, text: TEXT },
  ],
});
