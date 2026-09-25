import { defineCard } from "../define.js";

export default defineCard({
  name: "Thundering Tanadon",
  manaCost: "{4}{G/P}{G/P}",
  colors: ["G"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Beast"],
  power: 5,
  toughness: 4,
  keywords: ["trample"],
  text: "({G/P} can be paid with either {G} or 2 life.)\nTrample",
});
