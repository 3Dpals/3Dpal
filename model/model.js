/**
 * =================
 * SCHEMA - 3DObject
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines an 3D model of 3Dpal services.
 */

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var User3DObject = new Schema({
		name: { type: String, required: true},			// Username
		file: { type: String, required: true},			// Filename
		tags: { type: [String], required: false},		// Tags describing the model
		thumbnail: { type: String, required: true },	// Snapshot of the model
		creationDate: { type: Date, required: true },
		thumbnail: { type: String, required: true }		// Username of the creator
		
	});

	this.model = mongoose.model('3DObject', User3DObject);

	return this;
}

