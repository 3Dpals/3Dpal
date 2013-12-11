/**
 * =================
 * SCHEMA - File
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a File stored by the service
 */

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var FileSchema = new Schema({
		content: { type: String, required: false},	// Content of the file
	});

	this.model = mongoose.model('File', FileSchema);

	return this;
}

