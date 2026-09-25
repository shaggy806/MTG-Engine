import { defineCard } from "../define.js";

export default defineCard({
  name: "Manhole Cover",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this artifact enters, target creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)\n{2}, Sacrifice this artifact: Target player draws a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "draw", amount: 1, target: 0 },
      resolve: null,
      text: "{2}, Sacrifice this artifact: Target player draws a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      resolve: null,
      text: "When this artifact enters, target creature gains indestructible until end of turn.",
    },
  ],
});
