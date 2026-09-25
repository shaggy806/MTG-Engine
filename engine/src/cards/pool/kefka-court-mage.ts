import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #26 in top-commanders.txt. Transforms into Kefka, Ruler of Ruin.
//
// "Each player discards a card. Then you draw a card for each card type among
// cards discarded this way" — the draw is a later step of the sequence, so it
// counts once every player has chosen (`thisWay` with `cardTypes`).
const DISCARD_TEXT =
  "Whenever Kefka enters or attacks, each player discards a card. Then you draw a card for each " +
  "card type among cards discarded this way.";
const TRANSFORM_TEXT =
  "{8}: Each opponent sacrifices a permanent of their choice. Transform Kefka. Activate only as a sorcery.";
const discardThenDraw: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "discard", target: "each-player", amount: 1 },
    { kind: "draw", amount: { thisWay: "discarded", cardTypes: true } },
  ],
};

export default defineCard({
  name: "Kefka, Court Mage",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 5,
  text: `${DISCARD_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: discardThenDraw,
      resolve: null,
      text: DISCARD_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: discardThenDraw,
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "each-opponent", filter: {}, count: 1 },
          { kind: "transform", target: "source" },
        ],
      },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Kefka, Court Mage", "Kefka, Ruler of Ruin"],
  transform: true,
});
