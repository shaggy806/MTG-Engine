import { defineCard } from "../define.js";

// The targeted opponent decides (`chooser: 0`), and is offered the sacrifice
// only with two nonland, nontoken permanents to sacrifice (rule 118.3) — with
// fewer, they can't, so Rakdos's controller draws two.
const END_TEXT =
  "At the beginning of your end step, target opponent may sacrifice two nonland, nontoken permanents of their choice. If they don't, you draw two cards.";

export default defineCard({
  name: "Rakdos, Patron of Chaos",
  manaCost: "{4}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${END_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["opponent"],
      effect: {
        kind: "unless",
        chooser: 0,
        options: [
          {
            sacrifice: { notTypes: ["land"], token: false },
            count: 2,
            text: "Sacrifice two nonland, nontoken permanents",
          },
        ],
        otherwise: { kind: "draw", amount: 2 },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
