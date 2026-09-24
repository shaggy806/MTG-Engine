import { defineCard } from "../define.js";

// A layer-4 subtype grant and a layer-7b base P/T set on every other
// creature, whoever controls it. Counters and pumps still apply on top of
// the 2/2 (7c / 7d).
export default defineCard({
  name: "Kudo, King Among Bears",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 2,
  toughness: 2,
  text: "Other creatures have base power and toughness 2/2 and are Bears in addition to their other types.",
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature" }, excludeSelf: true },
      addSubtypes: ["Bear"],
      setBasePt: { power: 2, toughness: 2 },
      text: "Other creatures have base power and toughness 2/2 and are Bears in addition to their other types.",
    },
  ],
});
