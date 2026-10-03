import { defineCard } from "../define.js";

const ETB_TEXT =
  "When this creature enters, you may put a commander you own from the command zone onto the battlefield. It gains " +
  "haste. Return it to the command zone at the beginning of the next end step.";

// Put onto the battlefield, not cast: no commander tax, and none added (the
// ruling). It gains haste for as long as it's there. The return reaches it
// only while it's still the permanent it was (the other ruling).
export default defineCard({
  name: "Hellkite Courser",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${ETB_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "command",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        then: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword", target: 0, keyword: "haste", duration: "permanent" },
            {
              kind: "delayed-trigger",
              at: "next-end-step",
              effect: { kind: "put-in-command-zone", target: 0 },
              text: "Return the commander Hellkite Courser put onto the battlefield to the command zone.",
            },
          ],
        },
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
