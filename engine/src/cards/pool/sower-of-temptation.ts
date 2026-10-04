import { defineCard } from "../define.js";

// EDHREC rank 4058.
//
// Rulings:
//   [2007-10-01] If Sower of Temptation leaves the battlefield before the ability resolves, the
//     ability will have no effect.
//   [2007-10-01] You retain control of the targeted creature as long as Sower of Temptation
//     remains on the battlefield, even if a different player gains control of Sower of Temptation
//     itself.

export default defineCard({
  name: "Sower of Temptation",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, gain control of target creature for as long as this creature remains on the battlefield.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      // Opportunistic Dragon's `whileSource`: ends as Sower leaves, whoever controls
      // it meanwhile, and does nothing if it's already gone (the rulings).
      effect: { kind: "gain-control", target: 0, untilEndOfTurn: false, whileSource: true },
      resolve: null,
      text: "When this creature enters, gain control of target creature for as long as this creature remains on the battlefield.",
    },
  ],
});
