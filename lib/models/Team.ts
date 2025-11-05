import mongoose, { Schema, Document } from 'mongoose'

export interface ITeam extends Document {
  _id: string
  espnId: string
  name: string
  displayName: string
  abbreviation: string
  logo: string
  color: string
  alternateColor: string
  conferenceId: string
}

const TeamSchema = new Schema<ITeam>({
  _id: {
    type: String,
    required: true
  },
  espnId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  abbreviation: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  alternateColor: {
    type: String,
    required: true
  },
  conferenceId: {
    type: String,
    required: true,
    index: true
  }
}, {
  _id: false, // We're using custom _id
  timestamps: true
})

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)
