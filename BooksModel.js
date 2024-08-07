import mongoose from 'mongoose';
const { Schema } = mongoose;

const volumeInfoSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  authors: [{ type: String }],
  publisher: { type: String },
  publishedDate: { type: Date },
  description: { type: String },
  industryIdentifiers: [{ type: String }],
  pageCount: { type: Number },
  categories: [{ type: String }],
  imageLinks:[{ type: String }],
});

const bookSchema = new Schema({
  volumeInfo: volumeInfoSchema,
  type:[{ type: String }],
}, { strict: false });

const Book = mongoose.model('Book', bookSchema);

export {Book};
