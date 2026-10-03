import { defineCard } from "../define.js";

const TEXT =
  "Whenever a nontoken creature you control enters, you may pay {R}. If you do, create a token that's a copy " +
  "of that creature. That token gains haste. Exile it at the beginning of the next end step.";

// The rulings this follows: the token copies the creature's copiable values
// (what it's copying, if it's a copy; X is 0); it "gains haste" once it's
// made, not as a copy exception, so it keeps it if it's never exiled and a
// copy of the token doesn't have it; it's exiled at the next end step
// whoever controls it then, and one made during an end step waits for the
// next turn's.
export default defineCard({
  name: "Flameshadow Conjuring",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", token: false } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {R} to create a token that's a copy of that creature?",
        cost: "{R}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "create-token-copy", of: "trigger-object", count: 1, who: "you", exileAtEndStep: true },
            { kind: "grant-keyword-all", filter: { thisWay: "created" }, keyword: "haste", duration: "permanent" },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
