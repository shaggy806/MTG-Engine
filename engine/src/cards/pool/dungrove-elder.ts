import { defineCard } from "../define.js";

const PT_TEXT = "Dungrove Elder's power and toughness are each equal to the number of Forests you control.";

// A characteristic-defining ability (rule 604.3): it counts lands with the
// land type Forest, not only ones named Forest (the ruling).
export default defineCard({
  name: "Dungrove Elder",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 0,
  toughness: 0,
  keywords: ["hexproof"],
  text: `Hexproof (This creature can't be the target of spells or abilities your opponents control.)\n${PT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { subtype: "Forest", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
  ],
});
