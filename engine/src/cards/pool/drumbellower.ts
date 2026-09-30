import { defineCard } from "../define.js";

const TEXT = "Untap all creatures you control during each other player's untap step.";

// Seedborn Muse narrowed to creatures.
export default defineCard({
  name: "Drumbellower",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  static: [{ affects: { scope: "self" }, untapsDuringOthersUntap: { type: "creature" }, text: TEXT }],
});
