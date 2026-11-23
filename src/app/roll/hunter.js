import { MODULE_ID } from '../../constants.js'
import { hunterCell, increaseHunterDanger } from '../schema/hunter-state.js'

export async function rollHunter(actor, options, chooseConsequence) {
  let result
  await WOD5E.api.Roll({
    ...options,
    actor,
    data: actor.system,
    quickRoll: true,
    callback: (error, roll) => {
      if (error) throw error
      result = roll
    }
  })

  const desperation = result?.terms?.find((term) => term.dieType === 'advanced')
  const ones = desperation?.results.filter((die) => die.active !== false && die.result === 1).length ?? 0
  if (!ones || !actor.isOwner) return

  if (result.rollMode === 'blindroll' && !game.user.isGM) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      whisper: ChatMessage.getWhisperRecipients('GM').map((user) => user.id),
      blind: true,
      content: result.rollSuccessful
        ? '<p><strong>Hunter consequence</strong> · Resolve the blind test with the player. Overreach can raise Danger by up to ' + ones + '.</p>'
        : '<p><strong>Despair</strong> · This blind test failed. Mark Despair when the result can be revealed.</p>'
    })
    return
  }

  const choice = result.rollSuccessful ? await chooseConsequence(ones) : 'despair'
  if (!choice) return
  const overreach = choice === 'overreach'

  const cell = overreach ? hunterCell(actor) : null
  const pending = cell && !cell.isOwner
  let applied = 0
  if (overreach && !pending) {
    const source = cell ?? actor
    applied = await increaseHunterDanger(source, ones)
  } else if (!overreach) {
    await actor.update({ 'system.despair.value': 1 })
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: result.rollMode === 'blindroll' || result.rollMode === 'gmroll'
      ? ChatMessage.getWhisperRecipients('GM').map((user) => user.id)
      : result.rollMode === 'selfroll' ? [game.user.id] : [],
    blind: result.rollMode === 'blindroll',
    content: overreach
      ? `<p><strong>Overreach</strong> · Win kept. ${pending ? 'Danger up to +' + ones + ' pending Storyteller approval' : 'Danger +' + applied}.</p>`
      : '<p><strong>Despair</strong> · The test fails and the Hunter enters Despair.</p>'
  })

  if (pending) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      whisper: ChatMessage.getWhisperRecipients('GM').map((user) => user.id),
      content: '<p><strong>Overreach</strong> · Apply up to +' + ones + ' Danger to the Hunter’s cell.</p>',
      flags: { [MODULE_ID]: { cellDanger: { hunter: actor.uuid, cell: cell.uuid, amount: ones } } }
    })
  }
}
