import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 4546.
//
// Kicked, the two-card search replaces the one-card search (Grow from the
// Ashes' shape); the two finds are one per slot (Axgard Armory's
// `together.oneEach`), either of which may be missed (rule 701.19b). The life
// gain happens either way.
const BASIC_LAND = { supertype: "basic", type: "land" } as const;
const GAIN: EffectSpec = { kind: "gain-life", amount: 2 };

export default defineCard({
  name: "Aang's Journey",
  manaCost: "{2}",
  colors: [],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Kicker {2} (You may pay an additional {2} as you cast this spell.)\nSearch your library for a basic land card. If this spell was kicked, instead search your library for a basic land card and a Shrine card. Reveal those cards, put them into your hand, then shuffle.\nYou gain 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "search-library", filter: BASIC_LAND, destination: "hand", min: 0, max: 1, reveal: true },
      GAIN,
    ],
  },
  kicker: {
    cost: "{2}",
    effect: {
      kind: "sequence",
      effects: [
        {
          kind: "search-library",
          filter: { anyOf: [BASIC_LAND, { subtype: "Shrine" }] },
          destination: "hand",
          min: 0,
          max: 2,
          reveal: true,
          together: {
            oneEach: [
              { label: "a basic land card", filter: BASIC_LAND },
              { label: "a Shrine card", filter: { subtype: "Shrine" } },
            ],
          },
        },
        GAIN,
      ],
    },
  },
});
