import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of any creature on the battlefield with mana value less than or " +
  "equal to the amount of mana spent to cast this creature, except it's a Bird in addition to its other types and " +
  "it has flying.";

// All the mana spent to cast it counts, not only {X} (its ruling); put onto
// the battlefield without being cast, none was spent, so only a mana value 0
// creature may be copied.
export default defineCard({
  name: "Mockingbird",
  manaCost: "{X}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Bard"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${COPY_TEXT}`,
  copyOnEnter: {
    filter: { type: "creature", manaValue: { op: "lte", n: { amount: { manaSpentOf: "source" } } } },
    except: { addSubtypes: ["Bird"], keywords: ["flying"] },
  },
});
