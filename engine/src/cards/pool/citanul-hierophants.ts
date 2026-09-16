import { manaTapAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Citanul Hierophants",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 2,
  text: 'Creatures you control have "{T}: Add {G}."',
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsActivated: [manaTapAbility("G")],
      text: 'Creatures you control have "{T}: Add {G}."',
    },
  ],
});
