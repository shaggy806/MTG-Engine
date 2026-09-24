import { defineCard } from "../define.js";

const NON_HUMAN = { type: "creature", controlledBy: "you", notSubtypes: ["Human"] } as const;

// The mode is chosen as the spell is cast (rule 601.2b) — `castModal`, with
// no targets in either mode.
export default defineCard({
  name: "Return of the Wildspeaker",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Draw cards equal to the greatest power among non-Human creatures you control.\n" +
    "• Non-Human creatures you control get +3/+3 until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        targets: [],
        text: "Draw cards equal to the greatest power among non-Human creatures you control.",
        effect: {
          kind: "draw",
          amount: { aggregate: "max", of: "power", filter: NON_HUMAN },
        },
      },
      {
        targets: [],
        text: "Non-Human creatures you control get +3/+3 until end of turn.",
        effect: {
          kind: "modify-pt-all",
          filter: NON_HUMAN,
          power: 3,
          toughness: 3,
          duration: "end-of-turn",
        },
      },
    ],
  },
});
