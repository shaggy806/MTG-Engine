import { defineCard } from "../define.js";
import { evolve } from "../helpers.js";

const DRAW_TEXT =
  "Whenever an opponent casts a noncreature spell with mana value less than this creature's power, draw a card.";

// Power is compared as the spell is cast; once triggered, shrinking or losing
// Pollywog Prodigy doesn't stop the draw (the rulings).
export default defineCard({
  name: "Pollywog Prodigy",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Frog", "Wizard"],
  power: 1,
  toughness: 3,
  text:
    "Evolve (Whenever a creature you control enters, if that creature has greater power or toughness than this creature, put a +1/+1 counter on this creature.)\n" +
    DRAW_TEXT,
  triggered: [
    evolve(),
    {
      trigger: {
        on: "cast-spell",
        who: "opponent",
        filter: { notTypes: ["creature"], manaValue: { op: "lt", n: { amount: { powerOf: "source" } } } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
