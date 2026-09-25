import { defineCard } from "../define.js";

export default defineCard({
  name: "Morphling",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 3,
  toughness: 3,
  text: "{U}: Untap this creature.\n{U}: This creature gains flying until end of turn.\n{U}: This creature gains shroud until end of turn. (It can't be the target of spells or abilities.)\n{1}: This creature gets +1/-1 until end of turn.\n{1}: This creature gets -1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{U}: Untap this creature.",
    },
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains flying until end of turn.",
    },
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "shroud", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains shroud until end of turn.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets +1/-1 until end of turn.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: -1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets -1/+1 until end of turn.",
    },
  ],
});
