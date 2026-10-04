import { defineCard } from "../define.js";

// EDHREC rank 3665.
// Makes Treasure → uses "Treasure Token".
//
// "Target creature you don't control" — in a game with no teammates, a
// creature an opponent controls (Ayula, Queen Among Bears' fight mode).
export default defineCard({
  name: "Prizefight",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature you control fights target creature you don't control. (Each deals damage equal to its power to the other.)\nCreate a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "fight", a: 0, b: 1 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
