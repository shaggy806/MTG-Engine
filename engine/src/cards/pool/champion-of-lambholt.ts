import { defineCard } from "../define.js";

const BLOCK_TEXT = "Creatures with power less than this creature's power can't block creatures you control.";
const GROW_TEXT = "Whenever another creature you control enters, put a +1/+1 counter on this creature.";

// The powers are compared only as blockers are declared (the ruling), which
// is when a block filter is asked. It applies whether or not the Champion is
// attacking.
export default defineCard({
  name: "Champion of Lambholt",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 1,
  text: `${BLOCK_TEXT}\n${GROW_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you" } },
      cantBeBlockedBy: { power: { op: "lt", n: { amount: { powerOf: "source" } } } },
      text: BLOCK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
