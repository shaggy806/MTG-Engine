import { defineCard } from "../define.js";

export default defineCard({
  name: "Wily Bandar",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat", "Monkey"],
  power: 1,
  toughness: 1,
  text: "{2}{G}: This creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{G}: This creature gains indestructible until end of turn.",
    },
  ],
});
