import { defineCard } from "../define.js";

export default defineCard({
  name: "Invisible Stalker",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["hexproof", "unblockable"],
  text: "Hexproof\nInvisible Stalker can't be blocked.",
});
