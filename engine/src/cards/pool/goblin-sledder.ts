import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Sledder",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: "Sacrifice a Goblin: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a Goblin: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
