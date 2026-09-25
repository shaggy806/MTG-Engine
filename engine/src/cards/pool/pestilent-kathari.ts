import { defineCard } from "../define.js";

export default defineCard({
  name: "Pestilent Kathari",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bird", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "deathtouch"],
  text: "Flying\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\n{2}{R}: This creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{R}: This creature gains first strike until end of turn.",
    },
  ],
});
