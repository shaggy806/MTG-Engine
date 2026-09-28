import { defineCard } from "../define.js";

export default defineCard({
  name: "Will of the Temur",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Choose one. If you control a commander as you cast this spell, you may choose both instead.\n" +
    "• Create a token that's a copy of target permanent, except it's a 4/4 Dragon creature with flying in addition to its other types.\n" +
    "• Target player draws cards equal to the greatest mana value among permanents you control.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    maxModesIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 }, maxModes: 2 },
    modes: [
      {
        text:
          "Create a token that's a copy of target permanent, except it's a 4/4 Dragon creature with " +
          "flying in addition to its other types.",
        targets: ["permanent"],
        effect: {
          kind: "create-token-copy",
          of: 0,
          count: 1,
          who: "you",
          exceptions: { basePt: [4, 4], addTypes: ["creature"], addSubtypes: ["Dragon"], keywords: ["flying"] },
        },
      },
      {
        text: "Target player draws cards equal to the greatest mana value among permanents you control.",
        targets: ["player"],
        effect: {
          kind: "draw",
          target: 0,
          amount: { aggregate: "max", of: "mana-value", filter: { controlledBy: "you" } },
        },
      },
    ],
  },
});
