/**
 * =================
 * SCHEMA - 3dObject
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines an 3D model of 3Dpal services.
 */

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var ModelSchema = new Schema({
		name: { type: String, required: true},								// Username
		file: { type: String, required: true},								// Filename
		tags: { type: [String], required: false},							// Tags describing the model
		thumbnail: { type: String, required: true },						// Snapshot of the model
		creationDate: { type: Date, default: Date.now },					// Date of creation
		creator: { type: String, required: false },							// Username of the creator
		writers: [{ type: Schema.Types.ObjectId, ref: 'User' }],			// Users who got personally the right to edit and read
		readers: [{ type: Schema.Types.ObjectId, ref: 'User' }],			// Users who got personally the right to read only
		publicRead: { type: Boolean, required: true, default: false },		// Flag Public Read
		publicWrite: { type: Boolean, required: true, default: false }		// Flag Public Read & Write
	});

	this.model = mongoose.model('Model', ModelSchema);

	return this;
}

