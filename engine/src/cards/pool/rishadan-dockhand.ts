import { defineCard } from "../define.js";

export default defineCard({
  name: "Rishadan Dockhand",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 1,
  toughness: 2,
  keywords: ["islandwalk"],
  text: "Islandwalk (This creature can't be blocked as long as defending player controls an Island.)\n{1}, {T}: Tap target land.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["land"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Tap target land.",
    },
  ],
});
