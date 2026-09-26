import { defineCard } from "../define.js";

const TEXT = "This creature can't block and can't be blocked.";

export default defineCard({
  name: "Changeling Outcast",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 1,
  keywords: ["changeling"],
  text: `Changeling (This card is every creature type.)\n${TEXT}`,
  static: [
    { affects: { scope: "self" }, restrictions: ["cant-block"], grantKeywords: ["unblockable"], text: TEXT },
  ],
});
