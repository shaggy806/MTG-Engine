import { defineCard } from "../define.js";

//
// Rulings:
//   [2025-07-25] If an effect instructs you to “double” a creature’s power, that creature gets
//     +X/+0, where X is its power as that effect begins to apply. Similarly, a creature whose
//     toughness is doubled gets +0/+X, where X is its toughness as the effect begins to apply.
//   [2025-07-25] If a creature’s power is less than 0 when it’s doubled, instead that creature
//     gets -X/-0, where X is how much less than 0 its power is. For example, if an effect has
//     given Bear Cub, a 2/2 creature, -4/-0 so that it’s a -2/2 creature, doubling its power and
//     toughness gives it -2/+2, and it becomes a -4/4 creature.

export default defineCard({
  name: "Mightform Harmonizer",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Druid"],
  power: 4,
  toughness: 4,
  text: "Landfall — Whenever a land you control enters, double the power of target creature you control until end of turn.\nWarp {2}{G} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["creature-you-control"],
      effect: {
        kind: "modify-pt",
        target: 0,
        power: { powerOf: 0, doubling: true },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, double the power of target creature you control until end of turn.",
    },
  ],
  warp: { cost: "{2}{G}" },
});
