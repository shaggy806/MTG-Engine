import { defineCard } from "../define.js";

export default defineCard({
  name: "Wither and Bloom",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -3/-3 until end of turn.\n{1}{B}, Exile this card from your graveyard: Put a +1/+1 counter on target creature you control. Activate only as a sorcery.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{1}{B}, Exile this card from your graveyard: Put a +1/+1 counter on target creature you control. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});
