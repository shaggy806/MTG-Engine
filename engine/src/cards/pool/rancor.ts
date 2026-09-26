import { defineCard } from "../define.js";

const RETURN_TEXT = "When this Aura is put into a graveyard from the battlefield, return it to its owner's hand.";

// "It" is the card that went to the graveyard, followed there — gone from
// that graveyard by the time this resolves, it stays wherever it is (rule
// 400.7). An Aura spell that fizzles never reaches the battlefield, so it
// never triggers this (the ruling).
export default defineCard({
  name: "Rancor",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\nEnchanted creature gets +2/+0 and has trample.\n${RETURN_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +2/+0 and has trample.",
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
