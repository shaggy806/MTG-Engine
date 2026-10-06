import { defineCard } from "../define.js";

// EDHREC rank 6590.
//
// The sacrifice is a choice of yours as it resolves (Venom, Lethal Protector's `each-player-may`
// shape), and X is the sacrificed creature's mana value as it last existed on the battlefield.
const TEXT =
  "At the beginning of your end step, you may sacrifice a creature. If you do, look at the top X cards of your library, where X is that creature's mana value. You may put a creature card from among them onto the battlefield. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Industrial Advancement",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { type: "creature" }, text: "Sacrifice a creature" }],
        ifDid: {
          kind: "look-and-choose",
          zone: "library",
          count: { manaValueOf: "sacrificed" },
          min: 0,
          max: 1,
          destination: "battlefield",
          leftover: "bottom-random",
          filter: { type: "creature" },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
