import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

export default defineCard({
  name: "Tyrranax Rex",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Dinosaur"],
  power: 8,
  toughness: 8,
  keywords: ["trample", "haste"],
  toxic: 4,
  cantBeCountered: true,
  text:
    "This spell can't be countered.\n" +
    "Trample, ward {4}, haste\n" +
    "Toxic 4 (Players dealt combat damage by this creature also get four poison counters.)",
  triggered: [ward({ mana: "{4}" })],
});
