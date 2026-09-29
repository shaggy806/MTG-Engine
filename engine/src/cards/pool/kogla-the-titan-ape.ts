import { defineCard } from "../define.js";

const ENTER_TEXT = "When Kogla enters, it fights up to one target creature you don't control.";
const ATTACK_TEXT = "Whenever Kogla attacks, destroy target artifact or enchantment defending player controls.";
const HUMAN_TEXT =
  "{1}{G}: Return target Human you control to its owner's hand. Kogla gains indestructible until end of turn.";

// "A creature you don't control" is one an opponent controls: a free-for-all
// table has no teammates. With its one target gone, the Human ability does
// nothing at all — Kogla doesn't gain indestructible (the ruling).
export default defineCard({
  name: "Kogla, the Titan Ape",
  manaCost: "{3}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ape"],
  power: 7,
  toughness: 6,
  text: `${ENTER_TEXT}\n${ATTACK_TEXT}\n${HUMAN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "creature-an-opponent-controls" }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        {
          kind: "permanent",
          whose: "defending-player",
          filter: { typesAnyOf: ["artifact", "enchantment"] },
        },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Human" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: 0 },
          { kind: "grant-keyword", target: "source", keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: HUMAN_TEXT,
    },
  ],
});
