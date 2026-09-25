import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanctum Gargoyle",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Gargoyle"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, you may return target artifact card from your graveyard to your hand.",
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
