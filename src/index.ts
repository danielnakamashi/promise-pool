export default class PromisePool<Output> extends EventTarget {
  #maxConcurrentPromises: number
  #queue: (() => Promise<void>)[]
  #runningPromisesCount: number

  constructor(maxConcurrentPromises: number) {
    super()

    this.#maxConcurrentPromises = maxConcurrentPromises
    this.#queue = []
    this.#runningPromisesCount = 0
  }

  add(task: () => Promise<Output>) {
    return new Promise<Output>((resolve, reject) => {
      this.#queue.push(() =>
        task()
          .then(
            (value) => {
              resolve(value)
            },
            (reason: unknown) => {
              reject(reason as Error)
            },
          )
          .finally(() => {
            this.#runningPromisesCount -= 1
            this.#processQueue()

            this.#emitRunningTaskCountChanged()
          }),
      )
      this.#processQueue()
    })
  }

  #processQueue() {
    while (
      this.#runningPromisesCount < this.#maxConcurrentPromises &&
      this.#queue.length > 0
    ) {
      const task = this.#queue.shift()

      this.#runningPromisesCount += 1
      task?.()

      this.#emitRunningTaskCountChanged()
    }
  }

  #emitRunningTaskCountChanged() {
    this.dispatchEvent(
      new CustomEvent<number>('onRunningTaskCountChange', {
        detail: this.#runningPromisesCount,
      }),
    )
  }
}
