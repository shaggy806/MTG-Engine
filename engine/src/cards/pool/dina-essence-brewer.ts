import { defineCard } from "../define.js";

// X is the sacrificed creature's power as it last existed on the battlefield
// (2026-03-20 ruling) — `powerOf: "sacrificed"` reads it through last-known
// information.
export default defineCard({
  name: "Dina, Essence Brewer",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dryad", "Druid"],
  power: 2,
  toughness: 3,
  text: "Whenever you sacrifice a creature, draw a card. This ability triggers only once each turn.\n{2}, {T}, Sacrifice another creature: You gain X life and put X +1/+1 counters on target creature you control, where X is the sacrificed creature's power.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: { powerOf: "sacrificed" } },
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: { powerOf: "sacrificed" } },
        ],
      },
      resolve: null,
      text: "{2}, {T}, Sacrifice another creature: You gain X life and put X +1/+1 counters on target creature you control, where X is the sacrificed creature's power.",
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice a creature, draw a card. This ability triggers only once each turn.",
      oncePerTurn: true,
    },
  ],
});
