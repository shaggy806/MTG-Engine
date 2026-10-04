import { defineCard } from "../define.js";

// EDHREC rank 3423.

const TEXT = "This creature can't block and can't be blocked.";

export default defineCard({
  name: "Tormented Soul",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    { affects: { scope: "self" }, restrictions: ["cant-block"], grantKeywords: ["unblockable"], text: TEXT },
  ],
});
