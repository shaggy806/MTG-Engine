import { defineCard } from "../define.js";

// EDHREC rank 3037.
const TEXT = "All creatures have haste.";

export default defineCard({
  name: "Mass Hysteria",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  static: [{ affects: { scope: "all-creatures" }, grantKeywords: ["haste"], text: TEXT }],
});
