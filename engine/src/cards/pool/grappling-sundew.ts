import { defineCard } from "../define.js";

export default defineCard({
  name: "Grappling Sundew",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 4,
  keywords: ["defender", "reach"],
  text: "Defender, reach\n{4}{G}: This creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy this creature.)",
  activated: [
    {
      cost: { mana: "{4}{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{4}{G}: This creature gains indestructible until end of turn.",
    },
  ],
});
