import mongoose, { Document, Model, Schema } from 'mongoose';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectMemberRole = 'manager' | 'contributor' | 'reviewer' | 'viewer';

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: ProjectMemberRole;
  joinedAt: Date;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: Date;
  dueDate?: Date;
  manager: mongoose.Types.ObjectId;
  members: IProjectMember[];
  isArchived: boolean;
  isDemo?: boolean;
  color?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['manager', 'contributor', 'reviewer', 'viewer'],
      default: 'contributor',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project manager is required'],
      index: true,
    },
    members: [ProjectMemberSchema],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    color: {
      type: String,
      default: '#4F46E5', // Indigo default
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user projects
ProjectSchema.index({ 'members.user': 1 });
ProjectSchema.index({ manager: 1, isArchived: 1 });

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
