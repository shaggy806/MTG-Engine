import { defineCard } from "../define.js";

// - The creature is put from hand tapped and attacking (Kaalia of the Vast's
//   `look-and-choose`), attacking whichever player, planeswalker or battle its
//   controller chooses — not necessarily what Ilharg attacks (its ruling; rule
//   508.4). It was never declared, so "whenever a creature attacks" doesn't
//   see it (its ruling, 508.3a).
// - The return is Sneak Attack's delayed trigger on the card chosen: one that
//   left the battlefield before the end step stays where it went (its ruling,
//   rule 400.7).
// - "Dies or is put into exile from the battlefield" is God-Eternal Oketra's
//   leaves trigger (the God-Eternals' rulings, which Ilharg shares).
const ATTACK_TEXT =
  "Whenever Ilharg attacks, you may put a creature card from your hand onto the battlefield tapped and " +
  "attacking. Return that creature to your hand at the beginning of the next end step.";
const LEAVE_TEXT =
  "When Ilharg dies or is put into exile from the battlefield, you may put it into its owner's library third " +
  "from the top.";

export default defineCard({
  name: "Ilharg, the Raze-Boar",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Boar", "God"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\n${ATTACK_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
        enterTapped: true,
        attacking: "choose",
        then: {
          kind: "delayed-trigger",
          at: "next-end-step",
          effect: { kind: "return-to-hand", target: 0 },
          text: "Return the creature Ilharg put onto the battlefield to your hand.",
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard", "exile"] },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put Ilharg into its owner's library third from the top?",
        effect: { kind: "put-on-library", target: "trigger-object", position: { fromTop: 3 } },
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
