import { defineCard } from "../define.js";

export default defineCard({
  name: "Advanced Hoverguard",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drone"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{U}: This creature gains shroud until end of turn. (It can't be the target of spells or abilities.)",
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
