import { defineCard } from "../define.js";

// EDHREC rank 3544.
//
// Rulings:
//   [2017-08-25] If Patron of the Vein and a creature an opponent controls die simultaneously
//     (perhaps because they fought or were in combat together), Patron of the Vein's last ability
//     triggers, but Patron of the Vein won't be on the battlefield as that ability resolves. It
//     can't be saved by the +1/+1 counter that would have been put on it. The same is true of any
//     other Vampires you control that die at the same time. Your remaining Vampires will each get
//     a +1/+1 counter.
//   [2017-08-25] Destroying a creature with Patron of the Vein's first ability causes its last
//     ability to trigger if Patron of the Vein is still on the battlefield.
//   [2017-08-25] Patron of the Vein's last ability puts a +1/+1 counter on each Vampire you
//     control, including itself, even if the creature that died can't be exiled (most likely
//     because it was a token).
//
// "Exile it" finds the card in the graveyard it went to and nowhere else
// (rule 400.7); the counters go on regardless.
const ENTERS_TEXT = "When this creature enters, destroy target creature an opponent controls.";
const DIES_TEXT =
  "Whenever a creature an opponent controls dies, exile it and put a +1/+1 counter on each Vampire you control.";

export default defineCard({
  name: "Patron of the Vein",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ENTERS_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: ENTERS_TEXT,
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: "trigger-object" },
          { kind: "add-counter-all", filter: { subtype: "Vampire", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
