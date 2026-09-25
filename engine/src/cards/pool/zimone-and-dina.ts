import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #434 in top-commanders.txt.
//
// "Repeat this process once" is the same two steps again, only if you
// control eight or more lands after the first (the land just put down counts).
const DRAIN_TEXT = "Whenever you draw your second card each turn, target opponent loses 2 life and you gain 2 life.";
const SAC_TEXT =
  "{T}, Sacrifice another creature: Draw a card. You may put a land card from your hand onto the " +
  "battlefield tapped. If you control eight or more lands, repeat this process once.";
const process: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "draw", amount: 1 },
    {
      kind: "look-and-choose",
      zone: "hand",
      min: 0,
      max: 1,
      destination: "battlefield",
      enterTapped: true,
      leftover: "stay",
      filter: { type: "land" },
    },
  ],
};

export default defineCard({
  name: "Zimone and Dina",
  manaCost: "{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Dryad"],
  power: 3,
  toughness: 4,
  text: `${DRAIN_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, target: 0 },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          process,
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "land" }, atLeast: 8 },
            then: process,
          },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
