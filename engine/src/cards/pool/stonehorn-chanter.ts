import { defineCard } from "../define.js";

export default defineCard({
  name: "Stonehorn Chanter",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rhino", "Cleric"],
  power: 4,
  toughness: 4,
  text: "{5}{W}: This creature gains vigilance and lifelink until end of turn. (Attacking doesn't cause it to tap. Damage dealt by it also causes you to gain that much life.)",
  activated: [
    {
      cost: { mana: "{5}{W}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "vigilance",
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "lifelink",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{5}{W}: This creature gains vigilance and lifelink until end of turn.",
    },
  ],
});
