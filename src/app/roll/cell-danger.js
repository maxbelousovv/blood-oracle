import { MODULE_ID } from '../../constants.js'
import { hunterCell, increaseHunterDanger } from '../schema/hunter-state.js'

export function renderCellDangerRequest(message, html) {
  if (!game.user.isGM) return
  const request = message.getFlag(MODULE_ID, 'cellDanger')
  const amount = request?.amount
  if (!Number.isInteger(amount) || amount < 1 || amount > 5) return
  if (typeof request.hunter !== 'string' || typeof request.cell !== 'string') return
  const hunter = fromUuidSync(request.hunter)
  const cell = hunter && hunterCell(hunter)
  if (cell?.uuid !== request.cell || !hunter.testUserPermission(message.author, 'OWNER')) return
  const content = html.querySelector('.message-content')
  if (!content) return

  const button = html.ownerDocument.createElement('button')
  const applied = () => cell.getFlag(MODULE_ID, 'appliedDanger')?.[message.id] === true
  const refresh = () => {
    button.disabled = applied()
    button.textContent = applied() ? 'Danger applied' : 'Apply up to +' + amount + ' Danger'
  }
  refresh()
  button.addEventListener('click', async () => {
    if (button.disabled) return
    button.disabled = true
    try {
      if (hunterCell(hunter)?.uuid !== cell.uuid) throw new Error('Hunter no longer belongs to this cell')
      await increaseHunterDanger(cell, amount, message.id)
    } catch (error) {
      console.error('Blood Oracle | Cell Danger update failed', error)
      ui.notifications.error('Could not update cell Danger.')
    } finally {
      refresh()
    }
  })
  content.append(button)
}
