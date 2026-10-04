import { defineCard } from "../define.js";

// EDHREC rank 4735.
//
// Rulings:
//   [2024-09-20] You can't tap more creatures to cast this spell using convoke than are required
//     to pay its total cost.
// The hexproof grant is Saryth, the Viper's Fang's tapped-creature static.
const HEXPROOF_TEXT = "Other tapped creatures you control have hexproof.";

export default defineCard({
  name: "The Wandering Rescuer",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Samurai", "Noble"],
  power: 3,
  toughness: 4,
  keywords: ["flash", "double-strike"],
  convoke: true,
  text: `Flash\nConvoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nDouble strike\n${HEXPROOF_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", tapped: true }, excludeSelf: true },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
});
