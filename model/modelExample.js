/**
 * =================
 * SCHEMA - ModelExample
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Example.
 */
 
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var ModelExampleSchema = new Schema({
		my1stField: { type: String, required: true, index: { unique: true } },
		my2ndField: { type: Number, required: true }							
	});

	// Model Methods:
	ModelExampleSchema.methods.myMethod = function(xx) {
		/* whatever */
	};

	this.model = mongoose.model('ModelExample', ModelExampleSchema);

	return this;
}

