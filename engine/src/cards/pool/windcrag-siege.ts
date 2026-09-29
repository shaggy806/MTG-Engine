import { defineCard } from "../define.js";

const MARDU_TEXT =
  "Mardu — If a creature attacking causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.";
const JESKAI_TEXT =
  "Jeskai — At the beginning of your upkeep, create a 1/1 red Goblin creature token. It gains lifelink and haste until end of turn.";

export default defineCard({
  name: "Windcrag Siege",
  manaCost: "{1}{R}{W}",
  colors: ["R", "W"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Mardu or Jeskai.\n• ${MARDU_TEXT}\n• ${JESKAI_TEXT}`,
  chooseOnEnter: ["Mardu", "Jeskai"],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "chosen-on-enter", value: "Mardu" },
      doubleTriggers: { cause: "attacks" },
      text: MARDU_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Jeskai" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Goblin Token",
        count: 1,
        gainUntilEndOfTurn: ["lifelink", "haste"],
      },
      resolve: null,
      text: JESKAI_TEXT,
    },
  ],
});
