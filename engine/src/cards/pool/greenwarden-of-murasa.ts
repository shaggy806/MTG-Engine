import { defineCard } from "../define.js";

// EDHREC rank 3745.
//
// Rulings:
//   [2015-08-25] You decide whether to exile Greenwarden of Murasa as the last ability resolves.
//     Players can respond to this ability triggering, but once it starts resolving and you decide
//     to exile Greenwarden of Murasa, it's too late for anyone to respond.
//   [2015-08-25] If the target card becomes illegal before the last ability resolves, it won't
//     resolve. You can't exile Greenwarden of Murasa in that case, even if you want to.
//
// "You may exile it. If you do": the card it became, while it's still that
// card in the graveyard (Myrkul, Lord of Bones' shape); an illegal target
// fizzles the whole ability first, so nothing is exiled (the ruling).

const ENTER_TEXT = "When this creature enters, you may return target card from your graveyard to your hand.";
const DIES_TEXT =
  "When this creature dies, you may exile it. If you do, return target card from your graveyard to your hand.";

export default defineCard({
  name: "Greenwarden of Murasa",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 4,
  text: `${ENTER_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: {
        kind: "may",
        prompt: "Return target card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: {
        kind: "may",
        prompt: "Exile Greenwarden of Murasa to return target card from your graveyard to your hand?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: "trigger-object" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: { kind: "return-to-hand", target: 0, from: "graveyard" },
            },
          ],
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
