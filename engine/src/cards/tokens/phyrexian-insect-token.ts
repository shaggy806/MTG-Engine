import { defineCard } from "../define.js";

// 1/1 green Phyrexian Insect with infect — Phyrexian Swarmlord's token.
export default defineCard({
  name: "Phyrexian Insect Token",
  art: "5a90e8ab-5a76-4834-9cd6-186af939ea41",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect"],
  power: 1,
  toughness: 1,
  keywords: ["infect"],
  text: "Infect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",
});
