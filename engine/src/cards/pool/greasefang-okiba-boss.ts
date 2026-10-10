import { defineCard } from "../define.js";

// EDHREC rank 11420 (top-500 commander). The Vehicle returns as a
// noncreature artifact — it can be crewed, and has haste for when it is.
// The delayed trigger returns only that object: one that left the
// battlefield and came back is a new object (rule 400.7).
const TEXT =
  "At the beginning of combat on your turn, return target Vehicle card from your graveyard to the battlefield. It gains haste. Return it to its owner's hand at the beginning of your next end step.";

export default defineCard({
  name: "Greasefang, Okiba Boss",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Pilot"],
  power: 4,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Vehicle" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "permanent" },
          {
            kind: "delayed-trigger",
            at: "your-next-end-step",
            effect: { kind: "return-to-hand", target: 0 },
            text: "Return the Vehicle Greasefang returned to its owner's hand.",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
