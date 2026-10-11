import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 6681.
//
// One printed ability with two trigger events (Brinelin, the Moon Kraken's
// shape): its own entry, and the batched combat-damage trigger — once per
// player dealt combat damage by one or more Assassins you control in one
// damage step (first-strike and regular damage are two, rule 510.4).
// Historic is "artifact, legendary, or Saga" (rule 700.6; Arbaaz Mir's `anyOf`).

const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;
const TEXT =
  "When Layla Hassan enters and whenever one or more Assassins you control deal combat damage to a player, " +
  "return target historic card from your graveyard to your hand.";
const RETURN: EffectSpec = { kind: "return-to-hand", target: 0, from: "graveyard" };

export default defineCard({
  name: "Layla Hassan",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 3,
  toughness: 4,
  keywords: ["first-strike"],
  text: `First strike\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: HISTORIC }],
      effect: RETURN,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Assassin" }, combat: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: HISTORIC }],
      effect: RETURN,
      resolve: null,
      text: TEXT,
    },
  ],
});
