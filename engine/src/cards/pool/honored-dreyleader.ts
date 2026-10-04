import { defineCard } from "../define.js";

// EDHREC rank 3191.
//
// A permanent that's both a Squirrel and a Food counts once and triggers once
// (the rulings) — one `anyOf` filter on each ability. The count is read as
// the enters trigger resolves.
const ETB_TEXT = "When this creature enters, put a +1/+1 counter on it for each other Squirrel and/or Food you control.";
const OTHERS_TEXT = "Whenever another Squirrel or Food you control enters, put a +1/+1 counter on this creature.";
const SQUIRREL_OR_FOOD = { anyOf: [{ subtype: "Squirrel" }, { subtype: "Food" }] } as const;

export default defineCard({
  name: "Honored Dreyleader",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Squirrel", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: `Trample\n${ETB_TEXT}\n${OTHERS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter",
        target: "source",
        counter: "+1/+1",
        amount: { countOf: { ...SQUIRREL_OR_FOOD, controlledBy: "you" }, excludeSelf: true },
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: SQUIRREL_OR_FOOD, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: OTHERS_TEXT,
    },
  ],
});
