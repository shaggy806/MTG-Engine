import { defineCard } from "../define.js";

// EDHREC rank 3046.
// Makes Eldrazi Scion → uses "Eldrazi Scion Token".
//
// With no target chosen the ability still resolves and makes the Scions; a
// chosen target gone illegal fizzles the whole ability, Scions included (rule
// 608.2b — the ruling).
const TEXT =
  'At the beginning of your end step, return up to one target Eldrazi creature card from your graveyard to your hand. Create two 1/1 colorless Eldrazi Scion creature tokens with "Sacrifice this token: Add {C}."';

export default defineCard({
  name: "Spawnbed Protector",
  manaCost: "{7}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 6,
  toughness: 8,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        {
          kind: "optional",
          of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature", subtype: "Eldrazi" } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: 0, from: "graveyard" },
          { kind: "create-token", token: "Eldrazi Scion Token", count: 2 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
