import { defineCard } from "../define.js";

export default defineCard({
  name: "Scornful Aether-Lich",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 2,
  toughness: 4,
  text: "{W}{B}: This creature gains fear and vigilance until end of turn. (Attacking doesn't cause it to tap, and it can't be blocked except by artifact creatures and/or black creatures.)",
  activated: [
    {
      cost: { mana: "{W}{B}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "source", keyword: "fear", duration: "end-of-turn" },
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "vigilance",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{W}{B}: This creature gains fear and vigilance until end of turn.",
    },
  ],
});
