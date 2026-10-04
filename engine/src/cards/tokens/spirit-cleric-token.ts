import { defineCard } from "../define.js";

// Hallowed Haunting's Spirit Cleric token.

const PT_TEXT = "This token's power and toughness are each equal to the number of Spirits you control.";

export default defineCard({
  name: "Spirit Cleric Token",
  art: "5212bae5-d768-45ab-aba8-94c4f9fabc79",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Cleric"],
  power: 0,
  toughness: 0,
  text: PT_TEXT,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { subtype: "Spirit", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
  ],
});
