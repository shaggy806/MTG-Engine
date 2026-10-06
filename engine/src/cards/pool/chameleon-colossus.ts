import { defineCard } from "../define.js";

// EDHREC rank 6452.

export default defineCard({
  name: "Chameleon Colossus",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 4,
  toughness: 4,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\nProtection from black\n{2}{G}{G}: This creature gets +X/+X until end of turn, where X is its power.",
  activated: [
    {
      cost: { mana: "{2}{G}{G}", tap: false },
      targets: [],
      // X is its power as this resolves, read once for both halves (Winged
      // Temple of Orazca's shape); a negative power is 0 (rule 107.1b).
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { powerOf: "source" },
        toughness: { powerOf: "source" },
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{G}{G}: This creature gets +X/+X until end of turn, where X is its power.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["B"] },
      text: "Protection from black",
    },
  ],
});
