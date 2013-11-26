/**
 * =================
 * SCHEMA - Comment
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a Comment for a Model. (inspired by http://docs.mongodb.org/ecosystem/use-cases/storing-comments/)
 * Comments can be nested.
 */

discussion_id: ObjectId(...),
    parent_id: ObjectId(...),
    slug: '34db/8bda'
    full_slug: '2012.02.08.12.21.08:34db/2012.02.09.22.19.16:8bda',
    posted: ISODateTime(...),
    author: {
              id: ObjectId(...),
              name: 'Rick'
             },
    text: 'This is so bogus ... 
    
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var CommentSchema = new Schema({
		modelId: { type: Schema.Types.ObjectId, ref: 'Model', required: true },		// Model the comment is associated with
		parentId: { type: Schema.Types.ObjectId, ref: 'Comment', required: false },	// Parent comment if nested (answer)
		slug: { type: String, required: true},										// Slug
		fullSlug: { type: String, required: false },								// Full slug
		postedDate: { type: Date, default: Date.now },								// Date of creation
		author: { type: Schema.Types.ObjectId, ref: 'User' , required: true },		// User ID of the author
		text: { type: String, required: true }										// Content
	});

	this.model = mongoose.model('Comment', CommentSchema);

	return this;
}

