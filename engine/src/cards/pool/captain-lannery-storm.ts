import { defineCard } from "../define.js";

export default defineCard({
  name: "Captain Lannery Storm",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nWhenever Captain Lannery Storm attacks, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\nWhenever you sacrifice a Treasure, Captain Lannery Storm gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever Captain Lannery Storm attacks, create a Treasure token.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Treasure" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you sacrifice a Treasure, Captain Lannery Storm gets +1/+0 until end of turn.",
    },
  ],
});
