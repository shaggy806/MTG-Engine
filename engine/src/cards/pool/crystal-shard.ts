import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 6106.
//
// Rulings:
//   [2004-10-04] You can pay either of the two costs (but not both at the same time) to activate
//     the ability.

const TEXT = "{3}, {T} or {U}, {T}: Return target creature to its owner's hand unless its controller pays {1}.";

// "Unless its controller pays {1}": the creature's controller decides (an
// object in the chooser slot is read as its controller — Spell Pierce).
const BOUNCE: EffectSpec = {
  kind: "unless",
  chooser: 0,
  options: [{ pay: "{1}", text: "Pay {1}." }],
  otherwise: { kind: "return-to-hand", target: 0 },
};

export default defineCard({
  name: "Crystal Shard",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  // One ability with a choice of two costs, written as two activations, one
  // per cost: either is paid, never both (the ruling).
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: BOUNCE,
      resolve: null,
      text: TEXT,
    },
    {
      cost: { mana: "{U}", tap: true },
      targets: ["creature"],
      effect: BOUNCE,
      resolve: null,
      text: TEXT,
    },
  ],
});
