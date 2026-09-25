import { defineCard } from "../define.js";

export default defineCard({
  name: "Rubblebelt Maverick",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Detective"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)\n{G}, Exile this card from your graveyard: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{G}, Exile this card from your graveyard: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "When this creature enters, surveil 2.",
    },
  ],
});
