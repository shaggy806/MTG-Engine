import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const HEXPROOF_TEXT = "This creature has hexproof as long as it's untapped.";

export default defineCard({
  name: "Paradise Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 1,
  text: `${HEXPROOF_TEXT} (It can't be the target of spells or abilities your opponents control.)\n{T}: Add one mana of any color.`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { tapped: false } },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
