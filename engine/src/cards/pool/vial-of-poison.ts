import { defineCard } from "../define.js";

export default defineCard({
  name: "Vial of Poison",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, Sacrifice this artifact: Target creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      resolve: null,
      text: "{1}, Sacrifice this artifact: Target creature gains deathtouch until end of turn.",
    },
  ],
});
