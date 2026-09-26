import { defineCard } from "../define.js";

/** "Whenever this creature enters **or attacks**" is two triggers here — the
 * `TriggerSpec` union has one event per entry, and both do the same thing. */
const RECURSION = {
  targets: [
    {
      kind: "optional" as const,
      of: {
        kind: "card-in-graveyard" as const,
        whose: "you" as const,
        filter: { notTypes: ["instant", "sorcery"] as const, manaValue: { op: "lte" as const, n: 3 } },
      },
    },
  ],
  effect: { kind: "put-onto-battlefield" as const, target: 0, underYourControl: true },
  resolve: null,
  text: "Whenever Sun Titan enters or attacks, you may return target permanent card with mana value 3 or less from your graveyard to the battlefield.",
};

export default defineCard({
  name: "Sun Titan",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 6,
  toughness: 6,
  keywords: ["vigilance"],
  text:
    "Vigilance\n" +
    "Whenever Sun Titan enters or attacks, you may return target permanent card with mana value 3 or less from your graveyard to the battlefield.",
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, ...RECURSION },
    { trigger: { on: "attacks", who: "self" }, ...RECURSION },
  ],
});
