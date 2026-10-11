import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const BONUS_TEXT = "Equipped creature gets +3/+2.";
const ATTACH_TEXT = "Whenever a legendary creature you control enters, you may attach this Equipment to it.";

// "It" is the creature that entered, as long as it's still that object (rule
// 400.7), and this Equipment as long as it is; it moves off whatever it was
// on. The attach is no target, so no ward or hexproof stops it.
export default defineCard({
  name: "Hero's Blade",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${BONUS_TEXT}\n${ATTACH_TEXT}\nEquip {4}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, 2],
      text: BONUS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", supertype: "legendary" },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Attach Hero's Blade to it?",
        effect: { kind: "attach", target: "trigger-object" },
      },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
  activated: [equip("{4}")],
});
