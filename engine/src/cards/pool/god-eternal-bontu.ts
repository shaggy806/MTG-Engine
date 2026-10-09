import { defineCard } from "../define.js";

// World Shaper.
//
// - "Any number of other permanents" is chosen as the trigger resolves —
//   zero is allowed (its ruling) — and sacrificed as one event (rule
//   608.2c): a choose-permanents' answer applies to every pick at once, so
//   a "whenever one or more" sees one batch, and whatever triggers waits
//   until the cards are drawn (its ruling). "That many" counts what was
//   actually sacrificed this way.
// - The leaves trigger is Oketra's: "her" is the card found where it went,
//   and only there (rule 400.7); third from the top falls to the bottom of a
//   library of two or fewer cards.
const ENTER_TEXT =
  "When God-Eternal Bontu enters, sacrifice any number of other permanents, then draw that many cards.";
const LEAVE_TEXT =
  "When God-Eternal Bontu dies or is put into exile from the battlefield, you may put her into her " +
  "owner's library third from the top.";

export default defineCard({
  name: "God-Eternal Bontu",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "God"],
  power: 5,
  toughness: 6,
  keywords: ["menace"],
  text: `Menace\n${ENTER_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "choose-permanents",
            filter: { controlledBy: "you" },
            exceptSource: true,
            upTo: { countOf: { controlledBy: "you" } },
            then: { kind: "sacrifice-target", target: 0 },
            prompt: "Sacrifice any number of other permanents",
          },
          { kind: "draw", amount: { thisWay: "sacrificed" } },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard", "exile"] },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put God-Eternal Bontu into her owner's library third from the top?",
        effect: { kind: "put-on-library", target: "trigger-object", position: { fromTop: 3 } },
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
