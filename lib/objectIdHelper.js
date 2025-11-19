// lib/objectIdHelper.js - Standardized ObjectId handling utilities
import { ObjectId } from 'mongodb';

/**
 * Safely converts a value to ObjectId if possible
 * @param {*} id - The value to convert
 * @returns {ObjectId|null} - ObjectId if valid, null otherwise
 */
export function toObjectId(id) {
  try {
    if (!id) return null;
    
    // If it's already an ObjectId, return it
    if (id instanceof ObjectId) return id;
    
    // If it's a string, check if it's a valid ObjectId format
    if (typeof id === 'string' && ObjectId.isValid(id)) {
      return new ObjectId(id);
    }
    
    // If it's an object with a toString method
    if (id && typeof id.toString === 'function') {
      const strId = id.toString();
      if (ObjectId.isValid(strId)) {
        return new ObjectId(strId);
      }
    }
    
    return null;
  } catch (error) {
    // If any error occurs during conversion, return null
    return null;
  }
}

/**
 * Creates ObjectId candidates array for querying
 * @param {*} id - The ID to create candidates for
 * @returns {Array} - Array of possible ID formats for querying
 */
export function createIdCandidates(id) {
  const candidates = [];
  
  if (!id) return candidates;
  
  // Always include the original ID
  candidates.push(id);
  
  // Try to convert to ObjectId if possible
  const objectId = toObjectId(id);
  if (objectId) {
    candidates.push(objectId);
  }
  
  return candidates;
}

/**
 * Creates a MongoDB filter for ID queries that handles both string and ObjectId formats
 * @param {string} fieldName - The field name to filter on
 * @param {*} id - The ID value to match
 * @returns {Object} - MongoDB filter object
 */
export function createIdFilter(fieldName, id) {
  const candidates = createIdCandidates(id);
  return candidates.length > 0 ? { [fieldName]: { $in: candidates } } : {};
}

export default {
  toObjectId,
  createIdCandidates,
  createIdFilter
};