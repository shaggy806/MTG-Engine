import { defineCard } from "../define.js";

// EDHREC rank 6684.
//
// Rulings:
//   If the target is not legal as Ringwraiths's first ability tries to resolve, the ability is
//     removed from the stack. The creature's controller won't lose life.
//   The Ring can tempt you even if you don't control a creature. In this case, abilities that
//     trigger "whenever the Ring tempts you" will still trigger.
//
// The -3/-3 can't have killed the creature before the legendary check:
// state-based actions wait until the ability has finished resolving (rule
// 704.3), so "its controller" is read off the creature still there. The
// return works only from the graveyard (`fromGraveyard`, rule 113.6k), and
// `ring-tempts` fires whether or not a Ring-bearer was chosen (701.54d).

const ENTER_TEXT =
  "When this creature enters, target creature an opponent controls gets -3/-3 until end of turn. " +
  "If that creature is legendary, its controller loses 3 life.";
const RING_TEXT = "When the Ring tempts you, return this card from your graveyard to your hand.";

export default defineCard({
  name: "Ringwraiths",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wraith", "Knight"],
  power: 5,
  toughness: 5,
  text: `${ENTER_TEXT}\n${RING_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { supertype: "legendary" } },
            then: { kind: "lose-life", amount: 3, toControllerOfTarget: 0 },
          },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      fromGraveyard: true,
      trigger: { on: "ring-tempts", who: "you" },
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RING_TEXT,
    },
  ],
});
