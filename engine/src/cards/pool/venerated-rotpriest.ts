import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Whenever a creature you control becomes the target of a spell, target opponent gets a poison counter.";

// The trigger watches each creature you control: a spell naming two of them
// triggers it twice. Any opponent may be named, not only the one whose spell
// it was (`targeterNotTarget`).
export default defineCard({
  name: "Venerated Rotpriest",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Druid"],
  power: 1,
  toughness: 2,
  toxic: 1,
  text: `Toxic 1 (Players dealt combat damage by this creature also get a poison counter.)\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "becomes-target",
        who: "you-control",
        filter: { type: "creature" },
        spellOnly: true,
        targeterNotTarget: true,
      },
      targets: ["opponent"],
      effect: { kind: "add-player-counters", counter: "poison", amount: 1, target: 0 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
