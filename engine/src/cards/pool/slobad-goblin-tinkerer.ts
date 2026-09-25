import { defineCard } from "../define.js";

export default defineCard({
  name: "Slobad, Goblin Tinkerer",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Artificer"],
  power: 1,
  toughness: 2,
  text: "Sacrifice an artifact: Target artifact gains indestructible until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: ["artifact"],
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an artifact: Target artifact gains indestructible until end of turn.",
    },
  ],
});
