import { defineCard } from "../define.js";

// Returning Shigeki to hand is part of the first ability's cost, as
// discarding it is of channel's (the ruling); channel's X is how many
// targets it has, exactly — none at X = 0.
const REVEAL_TEXT =
  "{1}{G}, {T}, Return Shigeki to its owner's hand: Reveal the top four cards of your library. You may put a land card from among them onto the battlefield tapped. Put the rest into your graveyard.";
const CHANNEL_TEXT =
  "Channel — {X}{X}{G}{G}, Discard this card: Return X target nonlegendary cards from your graveyard to your hand.";

export default defineCard({
  name: "Shigeki, Jukai Visionary",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Snake", "Druid"],
  power: 1,
  toughness: 3,
  text: `${REVEAL_TEXT}\n${CHANNEL_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{G}", tap: true, returnSelfToHand: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: true,
        min: 0,
        max: 1,
        filter: { type: "land" },
        destination: "battlefield",
        enterTapped: true,
        leftover: "graveyard",
      },
      resolve: null,
      text: REVEAL_TEXT,
    },
    {
      cost: { mana: "{X}{X}{G}{G}", tap: false },
      zone: "hand",
      targets: [
        {
          kind: "any-number",
          of: { kind: "card-in-graveyard", whose: "you", filter: { notSupertype: "legendary" } },
          min: "x",
          max: "x",
        },
      ],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
        simultaneous: true,
      },
      resolve: null,
      text: CHANNEL_TEXT,
    },
  ],
});
