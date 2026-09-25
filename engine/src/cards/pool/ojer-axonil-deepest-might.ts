import { defineCard } from "../define.js";

// #245 in top-commanders.txt. Transforms into Temple of Power.
const DAMAGE_TEXT =
  "If a red source you control would deal an amount of noncombat damage less than Ojer Axonil's " +
  "power to an opponent, that source deals damage equal to Ojer Axonil's power instead.";
const DIES_TEXT = "When Ojer Axonil dies, return it to the battlefield tapped and transformed under its owner's control.";

export default defineCard({
  name: "Ojer Axonil, Deepest Might",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: `Trample\n${DAMAGE_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        atLeast: "this-power",
        combat: false,
        source: { colors: ["R"], controlledBy: "you" },
        to: "opponent",
      },
      text: DAMAGE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true, transformed: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  faces: ["Ojer Axonil, Deepest Might", "Temple of Power"],
  transform: true,
});

