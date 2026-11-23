import { storyCharacterType } from '../splats.js'

export async function rollStoryPool(actor, { label, dice, selectors = [], difficulty = 0, macro }) {
  if (dice < 1) {
    ui.notifications.warn('This NPC pool has no dice.')
    return false
  }
  const type = storyCharacterType(actor)
  try {
    await WOD5E.api.RollFromDataset({
      actor,
      dataset: {
        label,
        absoluteValue: dice,
        useAbsoluteValue: true,
        quickRoll: true,
        disableAdvancedDice: type !== 'vampire' && type !== 'werewolf',
        difficulty,
        selectors: selectors.join(' '),
        macroid: macro
      }
    })
    return true
  } catch (error) {
    console.error('Blood Oracle | Could not roll an NPC pool', error)
    ui.notifications.error('The NPC roll could not be completed.')
    return false
  }
}
