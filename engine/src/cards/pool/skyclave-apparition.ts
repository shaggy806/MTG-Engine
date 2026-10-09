import { defineCard } from "../define.js";

// Family Matters. The two abilities are linked (rule 607.2a): the first
// exiles *with* this stint (`exile`'s `linked`), and the second reads "the
// exiled card" through that link, though Skyclave has just left. Its rulings:
// with nothing exiled (its first ability hasn't resolved) nobody creates a
// token; with several cards exiled (a copied trigger), each of their owners
// creates one token sized by all of them together — the
// `"owners-of-exiled-with-source"` and `{ exiledWithSourceManaValue }` pair.
// "You don't control" is an opponent's (no teams); a creature on the
// battlefield with {X} in its cost has mana value with X as 0.
const ENTER_TEXT =
  "When this creature enters, exile up to one target nonland, nontoken permanent you don't control with mana value 4 or less.";
const LEAVE_TEXT =
  "When this creature leaves the battlefield, the exiled card's owner creates an X/X blue Illusion creature token, where X is the mana value of the exiled card.";
const X = { exiledWithSourceManaValue: true } as const;

export default defineCard({
  name: "Skyclave Apparition",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Spirit"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "permanent",
            whose: "opponent",
            filter: { notTypes: ["land"], token: false, manaValue: { op: "lte", n: 4 } },
          },
        },
      ],
      effect: { kind: "exile", target: 0, linked: true },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "for-each-player",
        who: "owners-of-exiled-with-source",
        effect: {
          kind: "create-token",
          token: "Illusion Token (Skyclave Apparition)",
          count: 1,
          who: "that-player",
          basePt: { power: X, toughness: X },
        },
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
