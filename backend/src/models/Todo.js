const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    // Blockchain-specific fields
    blockchainId: {
      type: String,
      required: true,
      index: true,
    },
    chainId: {
      type: Number,
      required: true,
      index: true,
    },
    transactionHash: {
      type: String,
      required: true,
    },

    // Task data (mirrors smart contract)
    owner: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Ethereum address!`,
      },
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Timestamps (from blockchain)
    blockchainCreatedAt: {
      type: Date,
      required: true,
    },
    blockchainCompletedAt: {
      type: Date,
      default: null,
    },

    // Sync status
    syncStatus: {
      type: String,
      enum: ["synced", "pending", "error"],
      default: "synced",
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },

    // Metadata
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt for MongoDB
  }
);

// Compound indexes for common queries
todoSchema.index({ owner: 1, deleted: 1, completed: 1 });
todoSchema.index({ chainId: 1, blockchainId: 1 }, { unique: true });

// Performance optimization indexes
// Index for time-based queries (e.g., recent tasks)
todoSchema.index({ blockchainCreatedAt: -1 });

// Compound index for user-specific time queries (most common query pattern)
todoSchema.index({ owner: 1, blockchainCreatedAt: -1 });

// Index for monitoring sync health and retry logic
todoSchema.index({ syncStatus: 1, lastSyncedAt: 1 });

// TTL index to automatically delete error status documents after 24 hours
// This prevents the database from accumulating stale error records
todoSchema.index(
  { lastSyncedAt: 1 },
  {
    expireAfterSeconds: 86400, // 24 hours
    partialFilterExpression: { syncStatus: "error" },
  }
);

// Instance methods
todoSchema.methods.markAsCompleted = function (blockchainCompletedAt) {
  this.completed = true;
  this.blockchainCompletedAt = blockchainCompletedAt;
  this.lastSyncedAt = new Date();
  return this.save();
};

todoSchema.methods.markAsDeleted = function () {
  this.deleted = true;
  this.lastSyncedAt = new Date();
  return this.save();
};

// Static methods
todoSchema.statics.findByOwner = function (
  ownerAddress,
  includeCompleted = true,
  includeDeleted = false
) {
  const query = {
    owner: ownerAddress.toLowerCase(),
  };

  if (!includeCompleted) {
    query.completed = false;
  }

  if (!includeDeleted) {
    query.deleted = false;
  }

  // Use blockchainCreatedAt for sorting to leverage the compound index
  return this.find(query).sort({ blockchainCreatedAt: -1 });
};

todoSchema.statics.findByBlockchainId = function (chainId, blockchainId) {
  return this.findOne({ chainId, blockchainId });
};

todoSchema.statics.countByOwner = function (ownerAddress) {
  return this.countDocuments({
    owner: ownerAddress.toLowerCase(),
    deleted: false,
  });
};

// Pre-save middleware
todoSchema.pre("save", function (next) {
  // Ensure owner address is lowercase
  if (this.owner) {
    this.owner = this.owner.toLowerCase();
  }
  next();
});

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
