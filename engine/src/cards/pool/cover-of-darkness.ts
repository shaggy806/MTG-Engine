import { defineCard } from "../define.js";

const FEAR_TEXT = "Creatures of the chosen type have fear.";

// Every creature of the chosen type, whoever controls it.
export default defineCard({
  name: "Cover of Darkness",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    "As this enchantment enters, choose a creature type.\n" +
    `${FEAR_TEXT} (They can't be blocked except by artifact creatures and/or black creatures.)`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", ofChosenType: true } },
      grantKeywords: ["fear"],
      text: FEAR_TEXT,
    },
  ],
});
