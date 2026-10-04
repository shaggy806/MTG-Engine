import { defineCard } from "../define.js";

// EDHREC rank 6151.
// Makes Elemental → new token "Elemental Token (Wildfire Awakener)".
//
// Rulings:
//   [2024-01-12] Convoke applies after the total cost is calculated. Convoke doesn't change a
//     spell's mana cost or mana value.
//   [2024-01-12] Tapping a multicolored creature using convoke will pay for {1} or one mana of
//     your choice of any of that creature's colors.

const ENTERS_TEXT =
  "When this creature enters, create X 1/1 red Elemental creature tokens with \"Whenever this token becomes tapped, it deals 1 damage to target player.\"";

export default defineCard({
  name: "Wildfire Awakener",
  manaCost: "{X}{1}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 2,
  convoke: true,
  text: `Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\n${ENTERS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Elemental Token (Wildfire Awakener)", count: "x" },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
