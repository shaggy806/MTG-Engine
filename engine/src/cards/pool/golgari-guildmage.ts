import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Guildmage",
  manaCost: "{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{4}{B}, Sacrifice a creature: Return target creature card from your graveyard to your hand.\n{4}{G}: Put a +1/+1 counter on target creature.",
  activated: [
    {
      cost: { mana: "{4}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{4}{B}, Sacrifice a creature: Return target creature card from your graveyard to your hand.",
    },
    {
      cost: { mana: "{4}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{4}{G}: Put a +1/+1 counter on target creature.",
    },
  ],
});
