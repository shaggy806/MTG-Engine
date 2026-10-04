import { defineCard } from "../define.js";

// EDHREC rank 4957.

export default defineCard({
  name: "Mistcutter Hydra",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["haste"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nHaste, protection from blue\nThis creature enters with X +1/+1 counters on it.",
  static: [
    { affects: { scope: "self" }, protection: { colors: ["U"] }, text: "Protection from blue" },
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
});
