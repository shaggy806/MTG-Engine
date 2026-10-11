import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const BONUS_TEXT = "Equipped creature gets +1/+1 for each creature you control with base power or toughness 1.";
const ATTACH_TEXT =
  "Whenever a Hamster, Mouse, Rat, or Squirrel you control enters, you may attach this Equipment to that creature.";

// The count is the Equipment controller's creatures ("you"), the equipped one
// included if its base power or toughness is 1, read live (Zinnia, Valley's
// Voice's shape). "That creature" only while it is still the object that
// entered (rule 400.7).
export default defineCard({
  name: "Sword of the Squeak",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${BONUS_TEXT}\n${ATTACH_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: {
        filter: {
          type: "creature",
          controlledBy: "you",
          anyOf: [{ basePower: { op: "eq", n: 1 } }, { baseToughness: { op: "eq", n: 1 } }],
        },
        pt: [1, 1],
      },
      text: BONUS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", anyOf: [{ subtype: "Hamster" }, { subtype: "Mouse" }, { subtype: "Rat" }, { subtype: "Squirrel" }] },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Attach Sword of the Squeak to that creature?",
        effect: { kind: "attach", target: "trigger-object" },
      },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
