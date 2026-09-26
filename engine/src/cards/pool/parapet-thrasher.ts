import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Whenever one or more Dragons you control deal combat damage to an opponent, choose one that hasn't been chosen this turn —";
const DESTROY_MODE = "Destroy target artifact that opponent controls.";
const DAMAGE_MODE = "This creature deals 4 damage to each other opponent.";
const IMPULSE_MODE = "Exile the top card of your library. You may play it this turn.";

// Once per opponent dealt damage by Dragons at once; past the third in a
// turn there's no mode left to choose (the ruling).
export default defineCard({
  name: "Parapet Thrasher",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}\n• ${DESTROY_MODE}\n• ${DAMAGE_MODE}\n• ${IMPULSE_MODE}`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { subtype: "Dragon" },
        to: "opponent",
        combat: true,
      },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        notChosenThisTurn: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: DESTROY_MODE,
            targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "artifact" } }],
            effect: { kind: "destroy", target: 0 },
          },
          { text: DAMAGE_MODE, effect: { kind: "damage", amount: 4, who: "each-other-opponent" } },
          { text: IMPULSE_MODE, effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" } },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${DESTROY_MODE} ${DAMAGE_MODE} ${IMPULSE_MODE}`,
    },
  ],
});
