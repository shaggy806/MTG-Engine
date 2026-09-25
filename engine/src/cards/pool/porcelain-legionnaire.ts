import { defineCard } from "../define.js";

export default defineCard({
  name: "Porcelain Legionnaire",
  manaCost: "{2}{W/P}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Soldier"],
  power: 3,
  toughness: 1,
  keywords: ["first-strike"],
  text: "({W/P} can be paid with either {W} or 2 life.)\nFirst strike",
});
