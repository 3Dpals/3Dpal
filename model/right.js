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
		modelId: { type: ObjectID, required: true},			// ID of the Model
		userId: { type: String, required: true},			// ID of the User
		rightLevel: { type: Number, required: true}			// 0 = none, 1 = Read, 10 = Write, 11 = Read+Write		
	});

	this.model = mongoose.model('Right', RightSchema);

	return this;
}

