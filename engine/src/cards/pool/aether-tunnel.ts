import { defineCard } from "../define.js";

// EDHREC rank 4332.

const TEXT = "Enchanted creature gets +1/+0 and can't be blocked.";

export default defineCard({
  name: "Aether Tunnel",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [1, 0], grantKeywords: ["unblockable"], text: TEXT }],
});
