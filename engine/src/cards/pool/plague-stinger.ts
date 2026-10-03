import { defineCard } from "../define.js";

export default defineCard({
  name: "Plague Stinger",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect", "Horror"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "infect"],
  text: "Flying\nInfect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",
});
