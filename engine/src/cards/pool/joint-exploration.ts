import { defineCard } from "../define.js";

// EDHREC rank 4981.
//
// Kicked, the whole effect is the kicker's (`kicker.effect` replaces the
// unkicked one): the same scry and draw, then Growth Spiral's "you may put a
// land card from your hand onto the battlefield".

const SCRY_DRAW = [
  { kind: "scry", amount: 2 },
  { kind: "draw", amount: 1 },
] as const;

export default defineCard({
  name: "Joint Exploration",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Kicker {G} (You may pay an additional {G} as you cast this spell.)\nScry 2, then draw a card. If this spell was kicked, you may put a land card from your hand onto the battlefield.",
  effect: { kind: "sequence", effects: [...SCRY_DRAW] },
  kicker: {
    cost: "{G}",
    effect: {
      kind: "sequence",
      effects: [
        ...SCRY_DRAW,
        {
          kind: "look-and-choose",
          zone: "hand",
          min: 0,
          max: 1,
          destination: "battlefield",
          leftover: "stay",
          filter: { type: "land" },
        },
      ],
    },
  },
});
