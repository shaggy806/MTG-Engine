import { defineCard } from "../define.js";

// EDHREC rank 3032.
//
// The front half of a meld pair, as Hanweir Garrison is: melding is Urza, Lord Protector's
// ability, not this card's, and Urza isn't in the pool, so nothing on this card is left out —
// its line about melding is reminder text. (Meld rulings, 2022-10-14, concern only the melded
// permanent and the instruction to meld.)
//
// The modes are chosen as the trigger goes on the stack (rule 700.2b — `announced`, Aether
// Channeler's shape). The mana is Karn, Legacy Reforged's deny-list (`notSpell`).
const ETB_TEXT = "When The Mightstone and Weakstone enters, choose one —";
const DRAW_MODE = "• Draw two cards.";
const SHRINK_MODE = "• Target creature gets -5/-5 until end of turn.";
const MANA_TEXT = "{T}: Add {C}{C}. This mana can't be spent to cast nonartifact spells.";

export default defineCard({
  name: "The Mightstone and Weakstone",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Powerstone"],
  text: `${ETB_TEXT}\n${DRAW_MODE}\n${SHRINK_MODE}\n${MANA_TEXT}\n(Melds with Urza, Lord Protector.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: DRAW_MODE, effect: { kind: "draw", amount: 2 } },
          {
            text: SHRINK_MODE,
            targets: ["creature"],
            effect: { kind: "modify-pt", target: 0, power: -5, toughness: -5, duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${DRAW_MODE} ${SHRINK_MODE}`,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 2,
        spendOnly: { notSpell: { notTypes: ["artifact"] }, text: "This mana can't be spent to cast nonartifact spells." },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
