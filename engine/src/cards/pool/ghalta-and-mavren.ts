import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever you attack, choose one —";
const DINOSAUR_MODE =
  "Create a tapped and attacking X/X green Dinosaur creature token with trample, where X is the greatest power " +
  "among other attacking creatures.";
const VAMPIRE_MODE =
  "Create X 1/1 white Vampire creature tokens with lifelink, where X is the number of other attacking creatures.";

// "For both modes, the value of X is determined as the ability resolves"
// (its ruling): the creatures attacking then, other than Ghalta and Mavren —
// so a live `attacking` filter is the card, not an approximation of the
// declaration. With none, the Dinosaur is a 0/0 that dies and no Vampire is
// made (the rulings). The Dinosaur's controller picks what it attacks.
export default defineCard({
  name: "Ghalta and Mavren",
  manaCost: "{3}{G}{G}{W}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Vampire"],
  power: 12,
  toughness: 12,
  keywords: ["trample"],
  text: `Trample\n${ATTACK_TEXT}\n• ${DINOSAUR_MODE}\n• ${VAMPIRE_MODE}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: DINOSAUR_MODE,
            effect: {
              kind: "create-token",
              token: "X/X Dinosaur Token (Trample)",
              count: 1,
              tapped: true,
              attacking: "choose",
              basePt: {
                power: { aggregate: "max", of: "power", filter: { type: "creature", attacking: true }, excludeSelf: true },
                toughness: {
                  aggregate: "max",
                  of: "power",
                  filter: { type: "creature", attacking: true },
                  excludeSelf: true,
                },
              },
            },
          },
          {
            text: VAMPIRE_MODE,
            effect: {
              kind: "create-token",
              token: "Lifelink Vampire Token",
              count: { countOf: { type: "creature", attacking: true }, excludeSelf: true },
            },
          },
        ],
      },
      resolve: null,
      text: `${ATTACK_TEXT} ${DINOSAUR_MODE} ${VAMPIRE_MODE}`,
    },
  ],
});
