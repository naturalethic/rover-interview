const assert = require('assert')

const sitter = require('./sitter')

test('calculate a ratings score', async () => {
  assert.throws(() => sitter.calculateRatingsScore(['foo']))
  assert.throws(() => sitter.calculateRatingsScore({}))
  assert.equal(sitter.calculateRatingsScore([1, 2, 3, 4, 5]), 3)
})

test('calculate a sitter score', async () => {
  assert.throws(() => sitter.calculateSitterScore(7))
  assert.equal(sitter.calculateSitterScore('abcdefghijklmnopqrstuvwxyz'), 5)
  assert.equal(sitter.calculateSitterScore('a$%%&*)- 11'), 0.19230769230769232)
  assert.equal(sitter.calculateSitterScore('Joshua K.'), 1.346153846153846)
  assert.equal(sitter.calculateSitterScore('Aa A.'), 0.19230769230769232)
})

test('calculate the overall sitter rank', async () => {
  const rank = await sitter.calculateRank('Lisa D.', [ 3, 5, 1, 4, 3, 5 ])
  assert.equal(rank, 2.4846153846153847)
})

test('provides a default page of 10 records of the proper shape', async () => {
  const { sitters, pageCount } = await sitter.list()
  assert.strictEqual(pageCount, 10)
  assert.equal(sitters.length, 10)
  assert.deepEqual(sitters[0], {
    id: 4,
    name: 'Lisa D.',
    email: 'user7177@verizon.net',
    phone: '19200811608',
    image: 'http://placekitten.com/g/500/500?user=4',
    rank: 2.4846153846153847
  })
})

test('properly sorts results', async () => {
  const { sitters } = await sitter.list({ sortBy: 'name' })
  assert.equal(sitters[0].email, 'user7938@verizon.net')
})

test('properly reverse sorts results', async () => {
  const { sitters } = await sitter.list({ sortBy: 'name', sortReverse: true })
  assert.equal(sitters[0].email, 'user6217@gmail.com')
})

test('properly pages and sorts results', async () => {
  const { sitters, pageCount } = await sitter.list({ pageNumber: 2, pageSize: 20, sortBy: 'name', sortReverse: true })
  assert.equal(pageCount, 5)
  assert.equal(sitters[0].email, 'user8635@verizon.net')
})

test('properly accounts for min rank', async () => {
  const { sitters } = await sitter.list({ sortBy: 'rank', minRank: 2 })
  assert.equal(sitters[0].email, 'user7759@hotmail.com')
})
