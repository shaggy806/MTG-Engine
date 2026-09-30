import { defineCard } from "../define.js";

const TEXT =
  "Whenever this creature attacks, add {R}{R}{R}{G}{G}{G}. Until end of turn, you don't lose this mana as steps and phases end.";

// `persists` keeps the mana through the turn's steps; cleanup still empties it.
export default defineCard({
  name: "Savage Ventmaw",
  manaCost: "{4}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-mana", mana: "R", amount: 3, persists: true },
          { kind: "add-mana", mana: "G", amount: 3, persists: true },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
