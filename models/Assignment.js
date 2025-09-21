import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'overdue'],
    default: 'draft'
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    files: [{
      filename: String,
      url: String,
      fileType: String
    }],
    grade: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: String,
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late'],
      default: 'submitted'
    }
  }],
  maxGrade: {
    type: Number,
    default: 100,
    min: 0
  },
  instructions: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AssignmentSchema.index({ assignedBy: 1, createdAt: -1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ class: 1 });
AssignmentSchema.index({ 'assignedTo': 1 });

// Virtual for checking if assignment is overdue
AssignmentSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed';
});

// Pre-save middleware to update the updatedAt field
AssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find recent assignments
AssignmentSchema.statics.findRecent = function(limit = 10) {
  return this.find({ isActive: true })
             .sort({ createdAt: -1 })
             .limit(limit)
             .populate('assignedBy', 'name email')
             .populate('assignedTo', 'name email');
};

// Instance method to check if assignment can be submitted
AssignmentSchema.methods.canSubmit = function() {
  return this.status === 'published' && new Date() <= this.dueDate;
};

// Instance methods for status management
AssignmentSchema.methods.markCompleted = function(completedBy = 'system') {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedByAlpha = completedBy === 'alpha';
  this.lastModifiedBy = completedBy;
  return this.save();
};

AssignmentSchema.methods.updateStatus = function(newStatus, updatedBy = 'system', notes = '') {
  this.status = newStatus;
  this.lastModifiedBy = updatedBy;
  this.statusChangeNotes = notes;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
    this.completedByAlpha = updatedBy === 'alpha';
  } else if (this.completedAt && newStatus !== 'completed') {
    // If moving away from completed status, clear completion data
    this.completedAt = null;
    this.completedByAlpha = false;
  }
  
  return this.save();
};

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);

export default Assignment;