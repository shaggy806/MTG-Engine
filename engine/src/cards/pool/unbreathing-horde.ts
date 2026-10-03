import { defineCard } from "../define.js";

const ENTER_TEXT =
  "This creature enters with a +1/+1 counter on it for each other Zombie you control and each Zombie card in your graveyard.";
const PREVENT_TEXT =
  "If this creature would be dealt damage, prevent that damage and remove a +1/+1 counter from it.";

// The count is read as it enters, never counting itself on the battlefield —
// but entering from your graveyard, it counts itself there (its ruling: the
// replacement applies before it moves). One counter goes however much damage
// is prevented, and with none on it the damage is still prevented (rulings).
export default defineCard({
  name: "Unbreathing Horde",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${PREVENT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: {
          kind: "+1/+1",
          amount: {
            sum: [
              { countOf: { subtype: "Zombie", controlledBy: "you" } },
              { countInGraveyard: { subtype: "Zombie", ownedBy: "you" } },
            ],
          },
        },
      },
      text: ENTER_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        prevent: true,
        to: "self",
        then: { kind: "remove-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      text: PREVENT_TEXT,
    },
  ],
});
