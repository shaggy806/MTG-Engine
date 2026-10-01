import { defineCard } from "../define.js";

const TEXT =
  "Creatures can't attack you unless their controller pays {2} for each creature they control that's attacking you.";

// A cost to attack you (rule 508.1h), not your planeswalkers (the ruling),
// paid after the attackers tap — so they can't tap for it.
export default defineCard({
  name: "Propaganda",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  static: [{ affects: { scope: "self" }, attackTax: { generic: 2 }, text: TEXT }],
});
