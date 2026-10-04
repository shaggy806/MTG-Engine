import { defineCard } from "../define.js";

// EDHREC rank 5812.

const RETURN_TEXT = "When enchanted creature dies, return it to the battlefield tapped under its owner's control.";

export default defineCard({
  name: "Fungal Fortitude",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: `Flash\nEnchant creature\nEnchanted creature gets +2/+0.\n${RETURN_TEXT}`,
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 0], text: "Enchanted creature gets +2/+0." }],
  triggered: [
    {
      // "It": the creature card in the graveyard it went to, only while it's
      // still there (rule 400.7) — Necrogen Communion's shape, under its
      // owner's control (the default) and tapped.
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "trigger-object", enterTapped: true },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
