import mongoose from 'mongoose';
import SkillsModel from '../domain/SkillsModel';

const SkillsSchema = new mongoose.Schema({
    name: {type: String}
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
});
export default mongoose.model<SkillsModel & mongoose.Document>('Skills', SkillsSchema);
