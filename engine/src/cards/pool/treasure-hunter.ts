import { defineCard } from "../define.js";

export default defineCard({
  name: "Treasure Hunter",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may return target artifact card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: {
        kind: "may",
        prompt: "Return target artifact card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target artifact card from your graveyard to your hand.",
    },
  ],
});
