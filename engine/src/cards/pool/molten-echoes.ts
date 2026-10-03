import { defineCard } from "../define.js";

const TEXT =
  "Whenever a nontoken creature you control of the chosen type enters, create a token that's a copy of that " +
  "creature. That token gains haste. Exile it at the beginning of the next end step.";

// The rulings this follows: the token copies the creature's copiable values
// — as it last existed if it has left by the time this resolves, and what
// it's copying if it's a copy (X is 0). "That token gains haste" isn't a copy
// exception: it's granted once the token is made, for as long as it lasts,
// so a copy of the token doesn't have it. It's exiled at the next end step
// whoever controls it then.
export default defineCard({
  name: "Molten Echoes",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose a creature type.\n${TEXT}`,
  chooseCreatureTypeOnEnter: true,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", token: false, ofChosenType: true },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token-copy", of: "trigger-object", count: 1, who: "you", exileAtEndStep: true },
          { kind: "grant-keyword-all", filter: { thisWay: "created" }, keyword: "haste", duration: "permanent" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
