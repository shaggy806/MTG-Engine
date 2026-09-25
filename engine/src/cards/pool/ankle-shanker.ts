import { defineCard } from "../define.js";

export default defineCard({
  name: "Ankle Shanker",
  manaCost: "{2}{R}{W}{B}",
  colors: ["W", "B", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Berserker"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nWhenever this creature attacks, creatures you control gain first strike and deathtouch until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "first-strike",
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "deathtouch",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "Whenever this creature attacks, creatures you control gain first strike and deathtouch until end of turn.",
    },
  ],
});
