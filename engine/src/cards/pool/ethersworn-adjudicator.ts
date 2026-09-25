import { defineCard } from "../define.js";

export default defineCard({
  name: "Ethersworn Adjudicator",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Vedalken", "Knight"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{1}{W}{B}, {T}: Destroy target creature or enchantment.\n{2}{U}: Untap this creature.",
  activated: [
    {
      cost: { mana: "{1}{W}{B}", tap: true },
      targets: ["creature-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}{W}{B}, {T}: Destroy target creature or enchantment.",
    },
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{2}{U}: Untap this creature.",
    },
  ],
});
