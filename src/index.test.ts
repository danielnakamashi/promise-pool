import PromisePool from '.'

async function wait(miliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, miliseconds)
  })
}

describe('PromisePool', () => {
  it('shold return a promise that resolves', async () => {
    const pool = new PromisePool(1)

    const result = await pool.add(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2)
          }, 100)
        }),
    )

    expect(result).toBe(2)
  })

  it('should return a promise that rejects', async () => {
    const pool = new PromisePool(1)

    const catchMockFn = jest.fn()
    try {
      await pool.add(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('rejected'))
            }, 100)
          }),
      )
    } catch (error) {
      catchMockFn(error)
    }

    expect(catchMockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'rejected',
      }),
    )
  })

  it('should call second task after first is finished', async () => {
    const taskMock = jest.fn<Promise<number>, [number]>(
      (data: number) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(data + 1)
          }, 500)
        }),
    )
    const pool = new PromisePool<number>(1)

    pool.add(() => taskMock(1))
    pool.add(() => taskMock(2))

    expect(taskMock).toHaveBeenCalledTimes(1)

    await wait(250)
    expect(taskMock).toHaveBeenCalledTimes(1)

    await wait(500)
    expect(taskMock).toHaveBeenCalledTimes(2)
  })
})
