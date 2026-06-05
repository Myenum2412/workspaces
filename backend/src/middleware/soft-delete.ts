// @ts-nocheck
/**
 * Soft-delete middleware and helpers.
 * Adds `deletedAt` field support to any Mongoose query.
 */
import { Schema, Document, Query, Model } from "mongoose";

// ── Schema plugin ─────────────────────────────────────────────
export function softDeletePlugin(schema: Schema) {
  schema.add({
    deletedAt: { type: String, default: null, index: true },
  });

  // Auto-filter deleted docs on find queries
  schema.pre(/^find/, function (this: Query<any, any>) {
    // Only auto-filter if not explicitly querying deleted docs
    const filter = this.getFilter();
    if (filter.deletedAt === undefined && filter.withDeleted !== true) {
      this.where({ deletedAt: null });
    }
    // Remove the withDeleted flag from the actual query
    if (filter.withDeleted !== undefined) {
      const newFilter = { ...filter };
      delete newFilter.withDeleted;
      this.setQuery(newFilter);
    }
  });

  // Auto-filter on count
  schema.pre(/^count/, function (this: Query<any, any>) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined && filter.withDeleted !== true) {
      this.where({ deletedAt: null });
    }
    if (filter.withDeleted !== undefined) {
      const newFilter = { ...filter };
      delete newFilter.withDeleted;
      this.setQuery(newFilter);
    }
  });

  // Soft delete methods
  schema.statics.softDelete = async function (filter: Record<string, any>) {
    return this.updateMany(filter, {
      $set: { deletedAt: new Date().toISOString() },
    });
  };

  schema.statics.restore = async function (filter: Record<string, any>) {
    return this.updateMany(filter, {
      $unset: { deletedAt: 1 },
    });
  };

  schema.statics.findDeleted = async function (filter: Record<string, any> = {}) {
    return this.find({ ...filter, deletedAt: { $ne: null } });
  };

  schema.statics.findWithDeleted = async function (filter: Record<string, any> = {}) {
    return this.find({ ...filter, withDeleted: true });
  };
}

// ── Type augmentation ─────────────────────────────────────────
export interface SoftDeleteDocument extends Document {
  deletedAt: string | null;
}

export interface SoftDeleteModel<T extends SoftDeleteDocument> extends Model<T> {
  softDelete(filter: Record<string, any>): Promise<{ modifiedCount: number }>;
  restore(filter: Record<string, any>): Promise<{ modifiedCount: number }>;
  findDeleted(filter?: Record<string, any>): Query<T[], T>;
  findWithDeleted(filter?: Record<string, any>): Query<T[], T>;
}
