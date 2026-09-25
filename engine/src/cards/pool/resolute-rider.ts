import { defineCard } from "../define.js";

export default defineCard({
  name: "Resolute Rider",
  manaCost: "{W/B}{W/B}{W/B}{W/B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 4,
  toughness: 2,
  text: "{W/B}{W/B}: This creature gains lifelink until end of turn.\n{W/B}{W/B}{W/B}: This creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  activated: [
    {
      cost: { mana: "{W/B}{W/B}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: "{W/B}{W/B}: This creature gains lifelink until end of turn.",
    },
    {
      cost: { mana: "{W/B}{W/B}{W/B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{W/B}{W/B}{W/B}: This creature gains indestructible until end of turn.",
    },
  ],
});
