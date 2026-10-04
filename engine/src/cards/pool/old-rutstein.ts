import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 4921.
//
// Rulings:
//   [2021-11-19] If you mill Dryad Arbor, a card that's both a creature and a land, you get both a
//     Treasure token and a 1/1 green Insect token.
//
// One card milled, so each "if a … card is milled this way" is a count of 0
// or 1 over the milled cards (`thisWay: "milled"`, read where the card went);
// the three checks are independent, so Dryad Arbor makes both.
const TEXT =
  "When Old Rutstein enters and at the beginning of your upkeep, mill a card. If a land card is milled this way, create a Treasure token. If a creature card is milled this way, create a 1/1 green Insect creature token. If a noncreature, nonland card is milled this way, create a Blood token.";

const mill: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "mill", target: "you", amount: 1 },
    { kind: "create-token", token: "Treasure Token", count: { thisWay: "milled", filter: { type: "land" } } },
    { kind: "create-token", token: "Insect Token", count: { thisWay: "milled", filter: { type: "creature" } } },
    {
      kind: "create-token",
      token: "Blood Token",
      count: { thisWay: "milled", filter: { notTypes: ["creature", "land"] } },
    },
  ],
};

export default defineCard({
  name: "Old Rutstein",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Peasant"],
  power: 1,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: mill,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: mill,
      resolve: null,
      text: TEXT,
    },
  ],
});
