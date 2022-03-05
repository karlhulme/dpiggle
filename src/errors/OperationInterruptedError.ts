/**
 * An error that is raised if an operation is interrupted.
 */
 export class OperationInterruptedError extends Error {
  /**
   * Constructs a new instance.
   */
  constructor () {
    super('Operation was interrupted.')
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = this.constructor.name
  }
}
