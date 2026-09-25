import { defineCard } from "../define.js";

export default defineCard({
  name: "Amaranthine Wall",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender\n{2}: This creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}: This creature gains indestructible until end of turn.",
    },
  ],
});
