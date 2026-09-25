import { defineCard } from "../define.js";

export default defineCard({
  name: "Galewind Moose",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Elk"],
  power: 6,
  toughness: 6,
  keywords: ["flash", "reach", "vigilance", "trample"],
  text: "Flash\nReach, vigilance, trample",
});
