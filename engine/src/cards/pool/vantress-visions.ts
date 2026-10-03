import { defineCard } from "../define.js";

// The Adventure half of Virtue of Knowledge. The copy has the ability's
// source and every choice made for it — the creature a cost sacrificed
// included — and makes the choices made on resolution again (the rulings).
export default defineCard({
  name: "Vantress Visions",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text:
    "Copy target activated or triggered ability you control. You may choose new targets for the copy. (Then exile " +
    "this card. You may cast the enchantment later from exile.)",
  targets: [{ kind: "ability", whose: "you" }],
  effect: { kind: "copy-ability", target: 0, newTargets: true },
  faces: ["Virtue of Knowledge", "Vantress Visions"],
  adventure: true,
});
