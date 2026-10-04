import { defineCard } from "../define.js";

// EDHREC rank 4079.

export default defineCard({
  name: "Vivien Reid",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Vivien"],
  loyalty: 5,
  text: "+1: Look at the top four cards of your library. You may reveal a creature or land card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.\n−3: Destroy target artifact, enchantment, or creature with flying.\n−8: You get an emblem with \"Creatures you control get +2/+2 and have vigilance, trample, and indestructible.\"",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      // Adaptive Omnitool's shape: only the card taken is revealed.
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { typesAnyOf: ["creature", "land"] },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: "+1: Look at the top four cards of your library. You may reveal a creature or land card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.",
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      // Broken Wings' target.
      targets: [
        {
          kind: "permanent",
          filter: { anyOf: [{ type: "artifact" }, { type: "enchantment" }, { type: "creature", keyword: "flying" }] },
        },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "−3: Destroy target artifact, enchantment, or creature with flying.",
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: [],
      // Garruk, Cursed Huntsman's emblem shape.
      effect: {
        kind: "create-emblem",
        text: "Creatures you control get +2/+2 and have vigilance, trample, and indestructible.",
        static: {
          affects: { scope: "creatures-you-control" },
          grantPt: [2, 2],
          grantKeywords: ["vigilance", "trample", "indestructible"],
          text: "Creatures you control get +2/+2 and have vigilance, trample, and indestructible.",
        },
      },
      resolve: null,
      text: "−8: You get an emblem with \"Creatures you control get +2/+2 and have vigilance, trample, and indestructible.\"",
    },
  ],
});
