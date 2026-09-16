import { manaTapAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Avacyn's Pilgrim",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {W}.",
  activated: [manaTapAbility("W")],
});
