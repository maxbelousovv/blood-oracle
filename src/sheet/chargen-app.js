import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import Chargen from '../app/chargen/Chargen.jsx'
import ErrorBoundary from '../app/components/ErrorBoundary.jsx'
import { chooseManual, isBlankCharacter, readDraft } from '../app/chargen/apply.js'

const { ApplicationV2 } = foundry.applications.api

/**
 * The character creation wizard, in a window of its own beside the sheet:
 * its steps need more room than a tab has. One window per actor; asking for
 * it again brings the open one forward.
 */
export class BloodOracleChargen extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ['blood-oracle', 'bo-chargen-window'],
    position: { width: 1120, height: 820 },
    window: { resizable: true, icon: 'fa-solid fa-droplet' }
  }

  #root = null
  #mount = null

  constructor(actor, options = {}) {
    const classes = [...BloodOracleChargen.DEFAULT_OPTIONS.classes, ...(options.classes ?? [])]
    super({ ...options, id: `blood-oracle-chargen-${actor.id}`, classes: ['hunter', 'werewolf'].includes(actor.type) ? [...classes, 'bo-splat-' + actor.type] : classes })
    this.actor = actor
  }

  get title() {
    return `Create a character — ${this.actor.name}`
  }

  async _renderHTML() {
    return null
  }

  _replaceHTML(result, content) {
    if (this.#root && content.contains(this.#mount)) return
    this.#teardown()
    this.#mount = content.ownerDocument.createElement('div')
    this.#mount.className = 'blood-oracle-root'
    content.replaceChildren(this.#mount)
    this.#root = createRoot(this.#mount)
    this.#root.render(
      createElement(ErrorBoundary, null, createElement(Chargen, { actor: this.actor, onClose: () => this.close() }))
    )
  }

  #teardown() {
    const root = this.#root
    this.#root = null
    this.#mount = null
    if (root) queueMicrotask(() => root.unmount())
  }

  _onClose(options) {
    super._onClose(options)
    this.#teardown()
  }

  /**
   * Start the wizard from the window menu. On a character that already has
   * ratings, say first that Finish writes over them.
   */
  static async start(actor) {
    if (!isBlankCharacter(actor) && !readDraft(actor)) {
      if (['hunter', 'werewolf'].includes(actor.type)) {
        ui.notifications.warn('Start the creator on a new, blank character.')
        return null
      }
      const ok = await foundry.applications.api.DialogV2.confirm({
        classes: ['blood-oracle', 'bo-dialog'],
        window: { title: 'Character creator' },
        content:
          `<p><strong>${foundry.utils.escapeHTML(actor.name)}</strong> already has ratings on the sheet.</p>` +
          '<p>The creator starts from nothing, and Finish writes its choices over them. Start anyway?</p>'
      })
      if (!ok) return null
    }
    return BloodOracleChargen.open(actor)
  }

  /**
   * The first time a blank vampire is opened: by the creator, or by hand?
   * Closing the question without an answer asks again next time.
   */
  static async offer(actor) {
    const choice = await foundry.applications.api.DialogV2.wait({
      classes: ['blood-oracle', 'bo-dialog', ...(['hunter', 'werewolf'].includes(actor.type) ? ['bo-splat-' + actor.type] : [])],
      window: { title: 'A new character' },
      content: '<p>How would you like to create this character?</p>',
      buttons: [
        { action: 'creator', label: 'Character creator', default: true },
        { action: 'manual', label: 'By hand' }
      ],
      rejectClose: false
    })
    if (choice === 'creator') return BloodOracleChargen.open(actor)
    if (choice === 'manual') await chooseManual(actor)
    return null
  }

  /** Open the wizard for an actor, or bring an open one forward. */
  static open(actor) {
    const existing = foundry.applications.instances?.get(`blood-oracle-chargen-${actor.id}`)
    if (existing) return existing.render({ force: true })
    return new BloodOracleChargen(actor).render({ force: true })
  }
}

Object.defineProperty(BloodOracleChargen, 'name', { value: 'BloodOracleChargen' })
