import { defineCard } from "../define.js";

export default defineCard({
  name: "Placid Rottentail",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus", "Rabbit"],
  power: 1,
  toughness: 1,
  keywords: ["vigilance"],
  text: "Vigilance\n{2}{G}, Exile this card from your graveyard: Put two +1/+1 counters on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "{2}{G}, Exile this card from your graveyard: Put two +1/+1 counters on target creature. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});
