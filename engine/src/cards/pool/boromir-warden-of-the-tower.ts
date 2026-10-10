import { defineCard } from "../define.js";

// EDHREC rank 859. Vexing Bauble's counter, an opponent's spell only. Its
// last ability sacrifices Boromir as its cost, so the Ring-bearer is chosen
// from what's left.
const COUNTER = "Whenever an opponent casts a spell, if no mana was spent to cast it, counter that spell.";
const SAC = "Sacrifice Boromir: Creatures you control gain indestructible until end of turn. The Ring tempts you.";

export default defineCard({
  name: "Boromir, Warden of the Tower",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance\n${COUNTER}\n${SAC}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { manaSpent: { op: "eq", n: 0 } } },
      targets: [],
      effect: { kind: "counter", target: "trigger-object" },
      resolve: null,
      text: COUNTER,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "indestructible",
            duration: "end-of-turn",
          },
          { kind: "the-ring-tempts-you" },
        ],
      },
      resolve: null,
      text: SAC,
    },
  ],
});
