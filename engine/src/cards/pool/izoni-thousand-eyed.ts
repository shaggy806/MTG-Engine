import { defineCard } from "../define.js";

// EDHREC rank 5118.
// Makes Insect → use "Insect Token (Black-Green)".
//
// Rulings:
//   [2018-10-05] Creature cards with other types, such as artifact creature cards, count for
//     undergrowth abilities.
//   [2018-10-05] You can activate Izoni's last ability while its undergrowth ability is on the
//     stack. This will increase the number of Insect tokens you'll create.
//   [2018-10-05] Because tokens aren't cards, they never count for undergrowth abilities.

const ENTER_TEXT =
  "Undergrowth — When Izoni enters, create a 1/1 black and green Insect creature token for each creature card in your graveyard.";

export default defineCard({
  name: "Izoni, Thousand-Eyed",
  manaCost: "{2}{B}{B}{G}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 3,
  text: `${ENTER_TEXT}\n{B}{G}, Sacrifice another creature: You gain 1 life and draw a card.`,
  activated: [
    {
      cost: { mana: "{B}{G}", tap: false, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "{B}{G}, Sacrifice another creature: You gain 1 life and draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Counted as it resolves (the ruling: sacrificing in response adds
      // Insects); cards only, so tokens never count.
      effect: {
        kind: "create-token",
        token: "Insect Token (Black-Green)",
        count: { countInGraveyard: { type: "creature", ownedBy: "you" } },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
