import { defineCard } from "../define.js";

// Either mode may target *any* spell or permanent: the colour is checked only
// as Pyroblast resolves (the 2016-06-08 ruling), so a non-blue target is legal
// and simply left alone. The mode is chosen before targets (the 2004-10-04
// ruling), which is what `castModal` does.
export default defineCard({
  name: "Pyroblast",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Counter target spell if it's blue.\n" +
    "• Destroy target permanent if it's blue.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Counter target spell if it's blue.",
        targets: ["spell"],
        effect: {
          kind: "conditional",
          condition: { kind: "target", index: 0, filter: { colors: ["U"] } },
          then: { kind: "counter", target: 0 },
        },
      },
      {
        text: "Destroy target permanent if it's blue.",
        targets: ["permanent"],
        effect: {
          kind: "conditional",
          condition: { kind: "target", index: 0, filter: { colors: ["U"] } },
          then: { kind: "destroy", target: 0 },
        },
      },
    ],
  },
});
