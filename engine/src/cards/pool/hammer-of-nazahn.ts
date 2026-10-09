import { defineCard } from "../define.js";
import { equip, thisOrAnother } from "../helpers.js";

const ATTACH_TEXT =
  "Whenever Hammer of Nazahn or another Equipment you control enters, you may attach that Equipment to target creature you control.";
const BONUS_TEXT = "Equipped creature gets +2/+0 and has indestructible.";

// One trigger per Equipment, several entering together included (the
// ruling). "That Equipment" is the one that entered, this stint only.
export default defineCard({
  name: "Hammer of Nazahn",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACH_TEXT}\n${BONUS_TEXT}\nEquip {4}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["indestructible"],
      text: BONUS_TEXT,
    },
  ],
  triggered: [
    ...thisOrAnother({
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Equipment" } },
      targets: ["creature-you-control"],
      effect: {
        kind: "may",
        prompt: "Attach that Equipment to the targeted creature?",
        effect: { kind: "attach", target: 0, attachment: "trigger-object" },
      },
      resolve: null,
      text: ATTACH_TEXT,
    }),
  ],
  activated: [equip("{4}")],
});
