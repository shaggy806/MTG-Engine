import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul Snare",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "{W}, Sacrifice Soul Snare: Exile target creature that's attacking you or a " +
    "planeswalker you control.",
  activated: [
    {
      cost: { mana: "{W}", tap: false, sacrifice: "self" },
      targets: ["creature-attacking-you"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text:
        "{W}, Sacrifice Soul Snare: Exile target creature that's attacking you or a " +
        "planeswalker you control.",
    },
  ],
});
