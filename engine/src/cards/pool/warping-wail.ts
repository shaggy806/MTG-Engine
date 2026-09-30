import { defineCard } from "../define.js";

export default defineCard({
  name: "Warping Wail",
  manaCost: "{1}{C}",
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Exile target creature with power or toughness 1 or less.\n" +
    "• Counter target sorcery spell.\n" +
    '• Create a 1/1 colorless Eldrazi Scion creature token. It has "Sacrifice this token: Add {C}."',
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Exile target creature with power or toughness 1 or less.",
        targets: [
          {
            kind: "permanent",
            filter: {
              type: "creature",
              anyOf: [{ power: { op: "lte", n: 1 } }, { toughness: { op: "lte", n: 1 } }],
            },
          },
        ],
        effect: { kind: "exile", target: 0 },
      },
      {
        text: "Counter target sorcery spell.",
        targets: [{ kind: "spell", filter: { type: "sorcery" } }],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: 'Create a 1/1 colorless Eldrazi Scion creature token. It has "Sacrifice this token: Add {C}."',
        targets: [],
        effect: { kind: "create-token", token: "Eldrazi Scion Token", count: 1 },
      },
    ],
  },
});
