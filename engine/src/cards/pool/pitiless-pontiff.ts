import { defineCard } from "../define.js";

export default defineCard({
  name: "Pitiless Pontiff",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 2,
  toughness: 2,
  text: "{1}, Sacrifice another creature: This creature gains deathtouch and indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "deathtouch",
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "indestructible",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{1}, Sacrifice another creature: This creature gains deathtouch and indestructible until end of turn.",
      otherOnly: true,
    },
  ],
});
