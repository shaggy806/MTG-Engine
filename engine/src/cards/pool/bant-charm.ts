import { defineCard } from "../define.js";

// EDHREC rank 5041.
//
// Rulings:
//   [2008-10-01] While the spell is on the stack, treat it as though its only text is the chosen
//     mode. The other two modes are treated as though they don't exist. You don't choose targets
//     for those modes.
//   [2008-10-01] You can choose a mode only if you can choose legal targets for that mode. If you
//     can't choose legal targets for any of the modes, you can't cast the spell.
//   [2008-10-01] If this spell is copied, the copy will have the same mode as the original.

export default defineCard({
  name: "Bant Charm",
  manaCost: "{G}{W}{U}",
  colors: ["W", "U", "G"],
  types: ["instant"],
  text: "Choose one —\n• Destroy target artifact.\n• Put target creature on the bottom of its owner's library.\n• Counter target instant spell.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: [{ kind: "permanent", filter: { type: "artifact" } }],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Put target creature on the bottom of its owner's library.",
        targets: [{ kind: "permanent", filter: { type: "creature" } }],
        effect: { kind: "put-on-bottom-of-library", target: 0 },
      },
      {
        text: "Counter target instant spell.",
        targets: [{ kind: "spell", filter: { type: "instant" } }],
        effect: { kind: "counter", target: 0 },
      },
    ],
  },
});
