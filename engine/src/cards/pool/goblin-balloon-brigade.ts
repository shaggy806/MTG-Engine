import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Balloon Brigade",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "{R}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gains flying until end of turn.",
    },
  ],
});
