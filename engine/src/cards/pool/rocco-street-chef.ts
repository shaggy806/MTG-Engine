import { defineCard } from "../define.js";

// #167 in top-commanders.txt.
//
// Each player may play the card they exiled, paying its costs and following
// its timing — a land still takes their land drop (its rulings) — until the
// next end step of Rocco's controller, whether or not Rocco is still there.
// Any card played from exile sets off the second ability, not only the ones
// Rocco exiled.
const END_TEXT =
  "At the beginning of your end step, each player exiles the top card of their library. Until your next end " +
  "step, each player may play the card they exiled this way.";
const PLAY_TEXT =
  "Whenever a player plays a land from exile or casts a spell from exile, you put a +1/+1 counter on target " +
  'creature and create a Food token. (It\'s an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")';

export default defineCard({
  name: "Rocco, Street Chef",
  manaCost: "{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 4,
  text: `${END_TEXT}\n${PLAY_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        duration: "your-next-end-step",
        whose: "each-player",
        playedBy: "owner",
      },
      resolve: null,
      text: END_TEXT,
    },
    {
      trigger: { on: "plays-card", who: "any", from: "exile" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "create-token", token: "Food Token", count: 1 },
        ],
      },
      resolve: null,
      text: PLAY_TEXT,
    },
  ],
});
