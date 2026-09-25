import { defineCard } from "../define.js";

export default defineCard({
  name: "Argivian Find",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Return target artifact or enchantment card from your graveyard to your hand.",
  targets: [
    {
      kind: "card-in-graveyard",
      whose: "you",
      filter: { typesAnyOf: ["artifact", "enchantment"] },
    },
  ],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
