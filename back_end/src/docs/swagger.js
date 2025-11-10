const swaggerJSDoc = require('swagger-jsdoc');
const m2s = require('mongoose-to-swagger');
const db = require('../models');

function buildModelSchemas() {
	const schemas = {};
	for (const value of Object.values(db)) {
		// Include only real Mongoose models
		if (value && typeof value === 'function' && value.modelName && value.schema) {
			const schema = m2s(value);
			// Ensure schema has a title
			schema.title = value.modelName;
			schemas[value.modelName] = schema;
		}
	}
	return schemas;
}

const swaggerDefinition = {
	openapi: '3.0.0',
	info: {
		title: 'CloudCake API',
		version: '1.0.0',
		description: 'API documentation for CloudCake backend',
	},
	servers: [
		{
			url: `http://${process.env.HOST_NAME || 'localhost'}:${process.env.PORT || 9999}`,
			description: 'Local server',
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
		},
		schemas: buildModelSchemas(),
	},
	security: [{ bearerAuth: [] }],
};

const options = {
	swaggerDefinition,
	apis: [
		// Add JSDoc annotations in routes/controllers to document endpoints
		'./src/routers/*.js',
		'./src/controller/*.js',
	],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerSpec };


