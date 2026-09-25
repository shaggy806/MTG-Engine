import { defineCard } from "../define.js";

export default defineCard({
  name: "Facevaulter",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "{B}, Sacrifice a Goblin: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, Sacrifice a Goblin: This creature gets +2/+2 until end of turn.",
    },
  ],
});
