import { defineCard } from "../define.js";
import { undying } from "../helpers.js";

const HUMAN_TEXT = "Whenever a Human deals damage to you, destroy it.";
const LORD_TEXT =
  "Other non-Human creatures you control get +1/+1 and have undying. (When a creature with undying dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)";

// Any Human's damage — combat or not, yours too (the rulings). The +1/+1
// is no counter, so it doesn't stop undying.
export default defineCard({
  name: "Mikaeus, the Unhallowed",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Cleric"],
  power: 5,
  toughness: 5,
  keywords: ["intimidate"],
  text:
    "Intimidate (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)\n" +
    `${HUMAN_TEXT}\n${LORD_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage", who: "any", filter: { subtype: "Human" }, to: "you" },
      targets: [],
      effect: { kind: "destroy", target: "trigger-object" },
      resolve: null,
      text: HUMAN_TEXT,
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", notSubtypes: ["Human"] },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      grantsTriggered: [undying()],
      text: LORD_TEXT,
    },
  ],
});
