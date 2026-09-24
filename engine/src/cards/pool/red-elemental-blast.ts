import { defineCard } from "../define.js";

// Unlike Pyroblast, the colour is part of each mode's target: a non-blue
// spell or permanent can't be chosen at all, and one that stops being blue
// before resolution is an illegal target.
export default defineCard({
  name: "Red Elemental Blast",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Choose one —\n• Counter target blue spell.\n• Destroy target blue permanent.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Counter target blue spell.",
        targets: [{ kind: "spell", filter: { colors: ["U"] } }],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Destroy target blue permanent.",
        targets: [{ kind: "permanent", filter: { colors: ["U"] } }],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
