import { defineCard } from "../define.js";

// EDHREC rank 3492.
// Makes Insect → new token "Insect Token (Nest of Scarabs)" (scaffolded).
//
// Rulings:
//   [2017-04-18] If an effect has you put more -1/-1 counters on a creature than it has toughness,
//     you’ll put all of those counters on it and create that many Insects, even if that makes its
//     toughness a negative number.
//   [2017-04-18] If a creature with wither or infect deals damage to a creature, the controller of
//     the creature with wither or infect puts that many -1/-1 counters on the second creature.

export default defineCard({
  name: "Nest of Scarabs",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever you put one or more -1/-1 counters on a creature, create that many 1/1 black Insect creature tokens.",
  triggered: [
    {
      // Hapatra's trigger: any creature, once per creature per event, as long
      // as you put the counters (wither/infect damage counts — the ruling).
      // "That many" is the counters put, even past its toughness.
      trigger: { on: "counters-put", who: "any", counter: "-1/-1", filter: { type: "creature" }, byYou: true },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token (Nest of Scarabs)", count: { triggerValue: true } },
      resolve: null,
      text: "Whenever you put one or more -1/-1 counters on a creature, create that many 1/1 black Insect creature tokens.",
    },
  ],
});
