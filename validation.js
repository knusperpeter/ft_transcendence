const fastify = require('fastify')({ logger: true })

fastify.route({
  method: 'GET',
  url: '/',
  schema: {
    // request needs to have a querystring with a `name` parameter
    querystring: {
      type: 'object',
      properties: {
          name: { type: 'string'}
      },
      required: ['name'],
    },
    // the response needs to be an object with an `hello` property of type 'string'
    response: {
      200: {
        type: 'object',
        properties: {
          hello: { type: 'string' }
        }
      }
    }
  },
  // this function is executed for every request before the handler is executed
  preHandler: (request, reply, done) => {
    if (!request.query.name) {
	  reply.status(400).send({ error: 'Name query parameter is required' })
	  return
	}
	const validNameRegex = /^[a-zA-Z]+$/
	if (!validNameRegex.test(request.query.name)) {
	  reply.status(400).send({ error: 'Name must contain only letters' })
	  return
	}
    done()
  },
  handler: (request, reply) => {
    reply.send({ hello: 'world' })
  }
})

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})