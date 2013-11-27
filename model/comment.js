/**
 * =================
 * SCHEMA - Comment
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a Comment for a Model. (inspired by http://docs.mongodb.org/ecosystem/use-cases/storing-comments/)
 * Comments can be nested.
 */

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var CommentSchema = new Schema({
		modelId: { type: Schema.Types.ObjectId, required: true },	// Model the comment is associated with
		parentId: { type: Schema.Types.ObjectId,required: false },	// Parent comment if nested (answer)
		slug: { type: String, required: true},						// Slug
		postedDate: { type: Date, default: Date.now },				// Date of creation
		author: { type: String, required: true },					// Username of the author
		text: { type: String, required: true }						// Content
	});

	this.model = mongoose.model('Comment', CommentSchema);

	return this;
}

