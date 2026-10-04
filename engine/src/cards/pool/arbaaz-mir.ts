import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 3676.
//
// Rulings:
//   [2024-07-05] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype.
//
// "Arbaaz Mir or another nontoken historic permanent you control enters" is
// two triggers (Go-Shintai of Life's Origin's shape): its own entry, token or
// not, and another's, only a nontoken historic one.
const TEXT =
  "Whenever Arbaaz Mir or another nontoken historic permanent you control enters, Arbaaz Mir deals 1 damage to each opponent and you gain 1 life. (Artifacts, legendaries, and Sagas are historic.)";
const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;
const PING: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "damage", amount: 1, who: "each-opponent" },
    { kind: "gain-life", amount: 1 },
  ],
};

export default defineCard({
  name: "Arbaaz Mir",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: PING,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { token: false, ...HISTORIC },
      },
      targets: [],
      effect: PING,
      resolve: null,
      text: TEXT,
    },
  ],
});
