import mongoose, { Document, Model, Schema } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  project: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId | null;
  creator: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  version: number;
  tags: string[];
  estimatedHours?: number;
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Associated project is required'],
      index: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for project board filters & sort
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ project: 1, assignee: 1 });
TaskSchema.index({ project: 1, dueDate: 1 });
TaskSchema.index({ assignee: 1, status: 1 });

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
