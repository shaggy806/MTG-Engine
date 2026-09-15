import { defineCard } from "../define.js";

// The 2/2 green Bird Sidequest: Raise a Chocobo makes — it carries its own
// landfall trigger, so it needs its own token card rather than a plain Bird.
export default defineCard({
  name: "Chocobo Bird Token",
  art: "https://scryfall.com/card/tfin/12/bird",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  text: "Whenever a land you control enters, this token gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever a land you control enters, this token gets +1/+0 until end of turn.",
    },
  ],
});
