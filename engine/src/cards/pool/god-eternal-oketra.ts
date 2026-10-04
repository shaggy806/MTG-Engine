import { defineCard } from "../define.js";

// EDHREC rank 2425.
//
// - The token trigger resolves before the creature spell, and even if that
//   spell is countered (its ruling).
// - "Dies or is put into exile from the battlefield" is one leaves trigger
//   for those two destinations (Kaya's Ghostform's shape). "It" is the card
//   found where it went, and only there (rule 400.7): a commander moved to
//   the command zone meanwhile, or a card that left the graveyard or exile,
//   stays put (its rulings). Third from the top falls to the bottom of a
//   library of two or fewer cards (its ruling). Whoever controlled the God
//   chooses (its ruling) — the ability's controller.
const CAST_TEXT =
  "Whenever you cast a creature spell, create a 4/4 black Zombie Warrior creature token with vigilance.";
const LEAVE_TEXT =
  "When God-Eternal Oketra dies or is put into exile from the battlefield, you may put it into its " +
  "owner's library third from the top.";

export default defineCard({
  name: "God-Eternal Oketra",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "God"],
  power: 3,
  toughness: 6,
  keywords: ["double-strike"],
  text: `Double strike\n${CAST_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Warrior Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard", "exile"] },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put God-Eternal Oketra into its owner's library third from the top?",
        effect: { kind: "put-on-library", target: "trigger-object", position: { fromTop: 3 } },
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
