import { defineCard } from "../define.js";

// EDHREC rank 5900.

const TEXT =
  "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control. Then if that creature has three or more +1/+1 counters on it, transform Hadana's Climb.";

export default defineCard({
  name: "Hadana's Climb",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: {
              kind: "target",
              index: 0,
              filter: { counters: { kind: "+1/+1", compare: { op: "gte", n: 3 } } },
            },
            then: { kind: "transform", target: "source" },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Hadana's Climb", "Winged Temple of Orazca"],
  transform: true,
});
