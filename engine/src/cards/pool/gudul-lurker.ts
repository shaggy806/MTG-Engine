import { defineCard } from "../define.js";

const UNBLOCKABLE_TEXT = "This creature can't be blocked.";

// Megamorph (rule 702.37b): turned face up for {U}, with a +1/+1 counter on
// it as it is — not when turned up any other way (the ruling).
export default defineCard({
  name: "Gudul Lurker",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Salamander"],
  power: 1,
  toughness: 1,
  text: `${UNBLOCKABLE_TEXT}\nMegamorph {U}`,
  morph: { keyword: "megamorph", cost: "{U}" },
  static: [{ affects: { scope: "self" }, grantKeywords: ["unblockable"], text: UNBLOCKABLE_TEXT }],
});
