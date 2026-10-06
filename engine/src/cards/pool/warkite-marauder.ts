import { defineCard } from "../define.js";

// Rulings:
//   [2018-01-19] Warkite Marauder's ability overwrites all previous effects that set the
//     creature's base power and toughness to specific values. Any power- or toughness-setting
//     effects that start to apply after the ability resolves will overwrite this effect.
//   [2018-01-19] If the affected creature gains an ability after Warkite Marauder's ability
//     resolves, it will keep that ability.
//   [2018-01-19] Effects that modify a creature's power and/or toughness, such as the effect of
//     Titanic Growth, will apply to the creature no matter when they started to take effect.

const TEXT =
  "Whenever this creature attacks, target creature defending player controls loses all abilities and has base power and toughness 0/1 until end of turn.";

// Azure Beastbinder's shape: one timestamped layer-6 loss plus a layer-7b
// base P/T (an `animate` adding no types), so later grants and P/T-setting
// effects still apply over it, and counters and pumps still modify it.
export default defineCard({
  name: "Warkite Marauder",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-defending-player-controls"],
      effect: {
        kind: "animate",
        target: 0,
        power: 0,
        toughness: 1,
        addTypes: [],
        addSubtypes: [],
        loseAbilities: true,
        duration: "end-of-turn",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
