import { defineCard } from "../define.js";

const COPY_TEXT =
  "As this artifact enters, you may have it become a copy of any creature on the battlefield until end of turn, " +
  "except it has haste.";

// While it's a copy it doesn't have its own mana ability, unless what it
// copied does (its ruling); in the cleanup step it's Cursed Mirror again. A
// copy of it made meanwhile keeps being the creature, haste and all — the
// duration isn't copiable (its ruling).
export default defineCard({
  name: "Cursed Mirror",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  text: `{T}: Add {R}.\n${COPY_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  copyOnEnter: {
    filter: { type: "creature" },
    except: { keywords: ["haste"] },
    untilEndOfTurn: true,
  },
});
