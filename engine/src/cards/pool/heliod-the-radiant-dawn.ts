import { defineCard } from "../define.js";

// EDHREC rank 3325.
//
// Rulings:
//   [2023-04-14] If a spell you cast has {X} in its mana cost, you choose the value of X before
//     calculating the spell’s total cost. For example, if a spell’s mana cost is {X}{R} and your
//     opponents have drawn two cards this turn, you could choose 5 as the value of X and pay
//     {3}{R} to cast the spell.
//   [2023-04-14] If there are additional costs to cast a spell, or if the cost to cast a spell is
//     increased by an effect (such as the one created by Thalia, Guardian of Thraben’s ability),
//     apply those increases before applying cost reductions.
//   [2023-04-14] The “as though they had flash” effect applies only to casting spells. It does
//     not, for example, change when you may activate abilities that can be activated “only as a
//     sorcery.”
//   [2023-04-14] That ability can’t reduce the amount of colored mana you pay for a spell. It
//     reduces only the generic mana component of that cost.
//   [2023-04-14] The last ability of Heliod, the Warped Eclipse doesn’t change the mana cost or
//     mana value of any spell. It changes only the total cost you pay.
//   [2023-04-14] The cost reduction can apply to alternative costs such as flashback costs.

const ETB_TEXT =
  "When Heliod enters, return target enchantment card that isn't a God from your graveyard to your hand.";
const TRANSFORM_TEXT = "{3}{U/P}: Transform Heliod. Activate only as a sorcery.";

export default defineCard({
  name: "Heliod, the Radiant Dawn",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  text: `${ETB_TEXT}\n{3}{U/P}: Transform Heliod. Activate only as a sorcery. ({U/P} can be paid with either {U} or 2 life.)`,
  activated: [
    {
      cost: { mana: "{3}{U/P}", tap: false },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: TRANSFORM_TEXT,
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment", notSubtypes: ["God"] } },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  faces: ["Heliod, the Radiant Dawn", "Heliod, the Warped Eclipse"],
  transform: true,
});
