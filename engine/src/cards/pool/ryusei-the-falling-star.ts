import { defineCard } from "../define.js";

// EDHREC rank 5974.
//
// The damage comes from Ryusei as it last existed (`damage-all` reads the
// source's last-known information once it has left).
export default defineCard({
  name: "Ryusei, the Falling Star",
  manaCost: "{5}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhen Ryusei dies, it deals 5 damage to each creature without flying.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "damage-all", filter: { type: "creature", notKeyword: "flying" }, amount: 5 },
      resolve: null,
      text: "When Ryusei dies, it deals 5 damage to each creature without flying.",
    },
  ],
});
