import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { logActivity } from "./activityLogController.js";

/**
 * Factory that produces standard REST CRUD handlers for the simple
 * "reference data" resources (Faculty, Department, Programme, Level,
 * Venue, TimeSlot, AcademicSession, Semester). Keeps controllers for
 * these near-identical resources DRY while remaining fully typed by
 * each Mongoose model's own schema/validation.
 */
export function createCrudController(Model, { entityName, populate = [] } = {}) {
  const applyPopulate = (query) => populate.reduce((q, p) => q.populate(p), query);

  const getAll = asyncHandler(async (req, res) => {
    const items = await applyPopulate(Model.find().sort({ createdAt: -1 }));
    res.json({ success: true, count: items.length, data: items });
  });

  const getOne = asyncHandler(async (req, res) => {
    const item = await applyPopulate(Model.findById(req.params.id));
    if (!item) throw new ApiError(404, `${entityName} not found`);
    res.json({ success: true, data: item });
  });

  const create = asyncHandler(async (req, res) => {
    const item = await Model.create(req.body);
    await logActivity(req.user._id, `CREATED_${entityName.toUpperCase()}`, entityName, item._id);
    res.status(201).json({ success: true, data: item });
  });

  const update = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) throw new ApiError(404, `${entityName} not found`);
    await logActivity(req.user._id, `UPDATED_${entityName.toUpperCase()}`, entityName, item._id);
    res.json({ success: true, data: item });
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, `${entityName} not found`);
    await logActivity(req.user._id, `DELETED_${entityName.toUpperCase()}`, entityName, req.params.id);
    res.json({ success: true, message: `${entityName} deleted` });
  });

  return { getAll, getOne, create, update, remove };
}
