import { defineCard } from "../define.js";

export default defineCard({
  name: "Adorned Crocodile",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 5,
  toughness: 3,
  text: "When this creature dies, create a 2/2 black Zombie Druid creature token.\nRenew — {B}, Exile this card from your graveyard: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Renew — {B}, Exile this card from your graveyard: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Druid Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 2/2 black Zombie Druid creature token.",
    },
  ],
});
