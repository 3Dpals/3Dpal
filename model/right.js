/**
 * =================
 * SCHEMA - Right
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a right binding a Model to an User (Read and/or Write)
 */

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var RightSchema = new Schema({
		modelId: { type: Schema.Types.ObjectId, required: true},			// ID of the Model
		userId: { type: String, required: true},			// ID of the User
		rightLevel: { type: Boolean, required: true}		// false = Read only, true = Read+Write	
	});

	this.model = mongoose.model('Right', RightSchema);

	return this;
}

