import { defineCard } from "../define.js";

export default defineCard({
  name: "Earthblighter",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{2}{B}, {T}, Sacrifice a Goblin: Destroy target land.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{2}{B}, {T}, Sacrifice a Goblin: Destroy target land.",
    },
  ],
});
