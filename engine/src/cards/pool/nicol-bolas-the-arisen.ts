import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// The back face of Nicol Bolas, the Ravager.
const creatureOrWalker: TargetSpec = {
  kind: "permanent",
  whose: "any",
  filter: { typesAnyOf: ["creature", "planeswalker"] },
};

export default defineCard({
  name: "Nicol Bolas, the Arisen",
  art: "https://cards.scryfall.io/art_crop/back/7/b/7b215968-93a6-4278-ac61-4e3e8c3c3943.jpg",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Bolas"],
  loyalty: 7,
  text:
    "+2: Draw two cards.\n" +
    "−3: Nicol Bolas deals 10 damage to target creature or planeswalker.\n" +
    "−4: Put target creature or planeswalker card from a graveyard onto the battlefield under your control.\n" +
    "−12: Exile all but the bottom card of target player's library.",
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "+2: Draw two cards.",
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [creatureOrWalker],
      effect: { kind: "damage", amount: 10, target: 0 },
      resolve: null,
      text: "−3: Nicol Bolas deals 10 damage to target creature or planeswalker.",
    },
    {
      loyaltyCost: -4,
      cost: { mana: null, tap: false },
      targets: [
        { kind: "card-in-graveyard", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "−4: Put target creature or planeswalker card from a graveyard onto the battlefield under your control.",
    },
    {
      loyaltyCost: -12,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: { kind: "exile-from-library", whose: 0, allBut: 1 },
      resolve: null,
      text: "−12: Exile all but the bottom card of target player's library.",
    },
  ],
  faces: ["Nicol Bolas, the Ravager", "Nicol Bolas, the Arisen"],
  transform: true,
});
