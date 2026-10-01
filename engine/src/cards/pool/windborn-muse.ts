import { defineCard } from "../define.js";

const TEXT =
  "Creatures can't attack you unless their controller pays {2} for each creature they control that's attacking you.";

export default defineCard({
  name: "Windborn Muse",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  static: [{ affects: { scope: "self" }, attackTax: { generic: 2 }, text: TEXT }],
});
