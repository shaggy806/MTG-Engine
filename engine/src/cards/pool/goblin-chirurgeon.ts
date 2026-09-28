import { defineCard } from "../define.js";

const TEXT = "Sacrifice a Goblin: Regenerate target creature.";

export default defineCard({
  name: "Goblin Chirurgeon",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 0,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["creature"],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
