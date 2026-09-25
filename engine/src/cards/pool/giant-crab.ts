import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Crab",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Crab"],
  power: 3,
  toughness: 3,
  text: "{U}: This creature gains shroud until end of turn. (It can't be the target of spells or abilities.)",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "shroud", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains shroud until end of turn.",
    },
  ],
});
