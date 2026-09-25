import { defineCard } from "../define.js";

export default defineCard({
  name: "Trusty Packbeast",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 3,
  text: "When this creature enters, return target artifact card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target artifact card from your graveyard to your hand.",
    },
  ],
});
