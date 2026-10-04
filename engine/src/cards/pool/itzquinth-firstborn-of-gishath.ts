import { defineCard } from "../define.js";

// EDHREC rank 5893.
//
// Rulings:
//   [2023-11-10] You don't choose targets for Itzquinth, Firstborn of Gishath's triggered ability
//     at the time it triggers. Rather, a second "reflexive" ability triggers when you pay {2} this
//     way. You choose targets for that ability as it goes on the stack. Each player may respond to
//     this triggered ability as normal.

const ENTER_TEXT =
  "When Itzquinth enters, you may pay {2}. When you do, target Dinosaur you control deals damage equal to its power to another target creature.";

export default defineCard({
  name: "Itzquinth, Firstborn of Gishath",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 3,
  keywords: ["haste"],
  text: `Haste\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Terra, Herald of Hope's "you may pay {2}. When you do" shape; the
      // reflexive ability chooses its targets as it goes on the stack.
      effect: {
        kind: "may",
        prompt: "Pay {2} to have a Dinosaur you control deal damage equal to its power to another creature?",
        cost: "{2}",
        effect: {
          kind: "reflexive-trigger",
          targets: [
            { kind: "permanent", whose: "you", filter: { subtype: "Dinosaur" } },
            { kind: "other", of: "creature", than: { slot: 0 } },
          ],
          // Bite Down's one-sided fight.
          effect: { kind: "fight", a: 0, b: 1, oneSided: true },
          text: "Target Dinosaur you control deals damage equal to its power to another target creature.",
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
