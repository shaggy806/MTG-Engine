import { defineCard } from "../define.js";

// Nothing is targeted: as the ability resolves you mill two, then choose an
// opponent, who chooses any nonland card in your graveyard — not only one
// just milled — to return to your hand (the rulings). Delve pays only
// generic mana and doesn't change its mana value (the rulings).
const RETURN_TEXT =
  "{2}{G/U}{G/U}: Mill two cards, then return a nonland card of an opponent's choice from your graveyard to your hand.";

export default defineCard({
  name: "Tasigur, the Golden Fang",
  manaCost: "{5}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 4,
  toughness: 5,
  text: `Delve (Each card you exile from your graveyard while casting this spell pays for {1}.)\n${RETURN_TEXT}`,
  delve: true,
  activated: [
    {
      cost: { mana: "{2}{G/U}{G/U}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 2 },
          {
            kind: "choose-opponent",
            then: {
              kind: "look-and-choose",
              zone: "graveyard",
              chooser: "that-player",
              min: 1,
              max: 1,
              filter: { notTypes: ["land"] },
              destination: "hand",
              leftover: "stay",
            },
          },
        ],
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
