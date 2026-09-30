import { defineCard } from "../define.js";

const LORD_TEXT = "Other Elves you control get +1/+1.";
const CAST_TEXT = "Whenever you cast an Elf spell, you may pay {G}. If you do, draw a card.";

export default defineCard({
  name: "Leaf-Crowned Visionary",
  manaCost: "{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: `${LORD_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Elf", controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Elf" } },
      targets: [],
      effect: { kind: "may", prompt: "Pay {G} to draw a card?", cost: "{G}", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
