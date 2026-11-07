import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import LevelUp from "../app/levelup/LevelUp.jsx"
import ErrorBoundary from '../app/components/ErrorBoundary.jsx'

const { ApplicationV2 } = foundry.applications.api

/**
 * The level-up window, beside the sheet:
 * every rating at once needs more room than a tab has. One window per actor;
 * asking for it again brings the open one forward.
 */
export class BloodOracleLevelUp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ['blood-oracle', 'bo-levelup-window'],
    position: { width: 1360, height: 880 },
    window: { resizable: true, icon: 'fa-solid fa-arrow-up' }
  }

  #root = null
  #mount = null

  constructor(actor, options = {}) {
    super({ ...options, id: `blood-oracle-levelup-${actor.id}` })
    this.actor = actor
  }

  get title() {
    return `Spend experience — ${this.actor.name}`
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
      createElement(ErrorBoundary, null, createElement(LevelUp, { actor: this.actor, onClose: () => this.close() }))
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

  /** Open the level-up for an actor, or bring an open one forward. */
  static open(actor) {
    const existing = foundry.applications.instances?.get(`blood-oracle-levelup-${actor.id}`)
    if (existing) return existing.render({ force: true })
    return new BloodOracleLevelUp(actor).render({ force: true })
  }
}

Object.defineProperty(BloodOracleLevelUp, 'name', { value: 'BloodOracleLevelUp' })
