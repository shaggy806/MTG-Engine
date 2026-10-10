import { roomCard } from "../helpers.js";
import left from "./greenhouse.js";
import right from "./rickety-gazebo.js";

// EDHREC rank 6665. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Greenhouse // Rickety Gazebo", left, right);
