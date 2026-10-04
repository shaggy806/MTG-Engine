import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

// EDHREC rank 2817.
//
// Rulings:
//   [2018-12-07] Once you activate Mistveil Plains's last ability, it doesn't matter if you lose
//     control of some of your white permanents.
//   [2018-12-07] A land card that produces white mana, even a Plains, normally has no color.

const PUT_TEXT =
  "{W}, {T}: Put target card from your graveyard on the bottom of your library. Activate only if you control two or more white permanents.";

export default defineCard({
  name: "Mistveil Plains",
  colors: [],
  types: ["land"],
  subtypes: ["Plains"],
  text: `({T}: Add {W}.)\nThis land enters tapped.\n${PUT_TEXT}`,
  static: [{ ...entersTappedStatic("Mistveil Plains"), text: "This land enters tapped." }],
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: "{W}", tap: true },
      condition: { kind: "controls", filter: { colors: ["W"] }, atLeast: 2 },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: {} }],
      effect: { kind: "put-on-library", target: 0, position: "bottom" },
      resolve: null,
      text: PUT_TEXT,
    },
  ],
});
