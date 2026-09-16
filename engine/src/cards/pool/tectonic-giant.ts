import { defineCard } from "../define.js";

// Both halves of "Whenever this creature attacks **or** becomes the target of
// a spell an opponent controls" share one effect; they're two triggered
// abilities here because they watch different events, and the two can't
// happen at once.
const CHOICE = {
  kind: "modal",
  minModes: 1,
  maxModes: 1,
  modes: [
    {
      text: "Deal 3 damage to each opponent",
      effect: { kind: "damage", amount: 3, who: "each-opponent" },
    },
    {
      text: "Exile the top two cards; play one until the end of your next turn",
      effect: {
        kind: "impulse-exile",
        amount: 2,
        duration: "your-next-turn",
        choose: 1,
      },
    },
  ],
} as const;

export default defineCard({
  name: "Tectonic Giant",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Giant"],
  power: 3,
  toughness: 4,
  text:
    "Whenever this creature attacks or becomes the target of a spell an opponent controls, choose one —\n" +
    "• This creature deals 3 damage to each opponent.\n" +
    "• Exile the top two cards of your library. Choose one of them. Until the end of your next turn, you may play that card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: CHOICE,
      resolve: null,
      text: "Whenever this creature attacks, choose one — deal 3 damage to each opponent; or exile the top two cards of your library and play one until the end of your next turn.",
    },
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: CHOICE,
      resolve: null,
      text: "Whenever this creature becomes the target of a spell an opponent controls, choose one — deal 3 damage to each opponent; or exile the top two cards of your library and play one until the end of your next turn.",
    },
  ],
});
