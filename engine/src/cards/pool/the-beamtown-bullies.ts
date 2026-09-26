import { defineCard } from "../define.js";

// #391 in top-commanders.txt.
//
// Only an opponent whose turn it is can be targeted, so the ability can only
// be activated during an opponent's turn. The opponent is the one who puts
// the card onto the battlefield, under their own control: an opponent gone
// illegal by then puts nothing anywhere (rule 608.2b). "It" is the creature
// that entered, so the rest waits on that. A delayed "exile it" made anyway
// would find the card still in the graveyard, where the ability doesn't
// expect it, and must do nothing (rule 603.7c).
const TEXT =
  "{T}: Target opponent whose turn it is puts target nonlegendary creature card from your graveyard onto the " +
  "battlefield under their control. It gains haste. Goad it. At the beginning of the next end step, exile it. " +
  "(Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)";

export default defineCard({
  name: "The Beamtown Bullies",
  manaCost: "{1}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ogre", "Devil", "Warrior"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "haste"],
  text: `Vigilance, haste\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [
        "opponent-whose-turn-it-is",
        { kind: "card-in-graveyard", whose: "you", filter: { type: "creature", notSupertype: "legendary" } },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 1, under: { target: 0 } },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "put-onto-battlefield" },
            then: {
              kind: "sequence",
              effects: [
                { kind: "grant-keyword", target: 1, keyword: "haste", duration: "permanent" },
                { kind: "goad", target: 1 },
                {
                  kind: "delayed-trigger",
                  at: "next-end-step",
                  // The same object: it kept its id across the move.
                  effect: { kind: "exile", target: 1 },
                  text: "Exile the creature The Beamtown Bullies put onto the battlefield.",
                },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
