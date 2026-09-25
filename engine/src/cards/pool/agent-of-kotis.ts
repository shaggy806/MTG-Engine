import { defineCard } from "../define.js";

export default defineCard({
  name: "Agent of Kotis",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  text: "Renew — {3}{U}, Exile this card from your graveyard: Put two +1/+1 counters on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "Renew — {3}{U}, Exile this card from your graveyard: Put two +1/+1 counters on target creature. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});
