/**
 * Constraint Satisfaction Problem (CSP) scheduler using Backtracking Search.
 *
 * VARIABLES : one "session" per course per required weekly meeting
 *             (course.sessionsPerWeek).
 * DOMAIN    : every (TimeSlot x Venue) combination whose venue capacity
 *             can hold the course's expected student count.
 * HARD CONSTRAINTS (must never be violated):
 *   1. Lecturer clash   - a lecturer cannot teach two sessions in the same time slot.
 *   2. Venue clash      - a venue cannot host two sessions in the same time slot.
 *   3. Student clash     - a class group (level + programme) cannot have two
 *                          sessions in the same time slot.
 *   4. Capacity          - venue.capacity >= course.studentCount.
 *
 * SEARCH STRATEGY:
 *   - Variable ordering uses the Minimum Remaining Values (MRV) heuristic:
 *     sessions with the fewest legal (venue x slot) options are scheduled
 *     first, since they are the most likely to fail and should be resolved
 *     while the search space is largest.
 *   - The algorithm is fully deterministic (no randomness): given identical
 *     input data it always explores the same search order and produces the
 *     same result, which keeps the output auditable and explainable to
 *     non-technical administrators.
 *   - Pure backtracking recurses depth-first, undoing an assignment and
 *     trying the next candidate whenever a partial assignment cannot be
 *     extended. To keep the generator usable on real, sometimes over-
 *     constrained departmental data, a session whose domain is fully
 *     exhausted after a bounded number of attempts is marked "unscheduled"
 *     (surfaced to the admin) rather than failing the entire run - this is
 *     a deliberate, documented deviation from textbook backtracking, chosen
 *     so the tool degrades gracefully instead of producing nothing at all.
 */

const MAX_STEPS_PER_SESSION = 20000; // safety budget to keep generation responsive

function classGroupKey(course) {
  const level = course.level?._id || course.level;
  const programme = course.programme?._id || course.programme || "none";
  return `${level}_${programme}`;
}

function eligibleVenues(course, venues) {
  const studentCount = course.studentCount || 0;
  return venues
    .filter((v) => v.isActive !== false && v.capacity >= studentCount)
    .sort((a, b) => a.capacity - b.capacity); // prefer tightest-fit venue first (better utilization)
}

export function generateTimetable({ courses, venues, timeSlots }) {
  const startTime = Date.now();
  let totalSteps = 0;

  if (!courses.length) {
    return {
      entries: [],
      stats: {
        totalCourses: 0,
        scheduledCourses: 0,
        unscheduledCourses: [],
        backtrackSteps: 0,
        generationTimeMs: 0,
        conflictCount: 0,
      },
    };
  }
  if (!venues.length || !timeSlots.length) {
    throw new Error("Cannot generate a timetable with no venues or no time slots defined.");
  }

  // Build the list of variables (one per required weekly session).
  const sessions = [];
  courses.forEach((course) => {
    const count = Math.max(1, course.sessionsPerWeek || 1);
    const lecturer = course.lecturers?.[0]?._id || course.lecturers?.[0];
    for (let i = 0; i < count; i++) {
      sessions.push({
        course,
        sessionIndex: i,
        lecturer,
        classGroup: classGroupKey(course),
        domain: eligibleVenues(course, venues),
      });
    }
  });

  // MRV heuristic: fewest legal options first.
  sessions.sort((a, b) => a.domain.length * timeSlots.length - b.domain.length * timeSlots.length);

  const lecturerBusy = new Set(); // `${lecturerId}::${timeSlotId}`
  const venueBusy = new Set(); // `${venueId}::${timeSlotId}`
  const classGroupBusy = new Set(); // `${classGroup}::${timeSlotId}`
  const courseDayUsed = new Map(); // courseId -> Set(day) - discourage same course twice same day (soft, best-effort)

  const assignment = [];
  const unscheduled = [];

  function isConsistent(session, timeSlot, venue) {
    if (session.lecturer && lecturerBusy.has(`${session.lecturer}::${timeSlot._id}`)) return false;
    if (venueBusy.has(`${venue._id}::${timeSlot._id}`)) return false;
    if (classGroupBusy.has(`${session.classGroup}::${timeSlot._id}`)) return false;
    return true;
  }

  function place(session, timeSlot, venue) {
    if (session.lecturer) lecturerBusy.add(`${session.lecturer}::${timeSlot._id}`);
    venueBusy.add(`${venue._id}::${timeSlot._id}`);
    classGroupBusy.add(`${session.classGroup}::${timeSlot._id}`);
    const cId = String(session.course._id);
    if (!courseDayUsed.has(cId)) courseDayUsed.set(cId, new Set());
    courseDayUsed.get(cId).add(timeSlot.day);
    assignment.push({ session, timeSlot, venue });
  }

  function remove(session, timeSlot, venue) {
    if (session.lecturer) lecturerBusy.delete(`${session.lecturer}::${timeSlot._id}`);
    venueBusy.delete(`${venue._id}::${timeSlot._id}`);
    classGroupBusy.delete(`${session.classGroup}::${timeSlot._id}`);
    assignment.pop();
  }

  // Order candidate slots so that, all else equal, a course's repeat
  // sessions land on different days (soft spread preference).
  function orderedSlots(session) {
    const usedDays = courseDayUsed.get(String(session.course._id));
    if (!usedDays || usedDays.size === 0) return timeSlots;
    const fresh = timeSlots.filter((t) => !usedDays.has(t.day));
    const repeated = timeSlots.filter((t) => usedDays.has(t.day));
    return [...fresh, ...repeated];
  }

  function backtrack(index) {
    if (index === sessions.length) return true;
    const session = sessions[index];
    let steps = 0;

    for (const timeSlot of orderedSlots(session)) {
      for (const venue of session.domain) {
        steps++;
        totalSteps++;
        if (steps > MAX_STEPS_PER_SESSION) break;
        if (isConsistent(session, timeSlot, venue)) {
          place(session, timeSlot, venue);
          if (backtrack(index + 1)) return true;
          remove(session, timeSlot, venue);
        }
      }
      if (steps > MAX_STEPS_PER_SESSION) break;
    }

    // Domain exhausted for this session: record and move on so the rest
    // of the timetable can still be generated (graceful degradation).
    unscheduled.push(session.course._id);
    return backtrack(index + 1);
  }

  backtrack(0);

  const entries = assignment.map((a) => ({
    course: a.session.course._id,
    lecturer: a.session.lecturer,
    venue: a.venue._id,
    timeSlot: a.timeSlot._id,
    level: a.session.course.level?._id || a.session.course.level,
    programme: a.session.course.programme?._id || a.session.course.programme,
  }));

  const uniqueUnscheduled = [...new Set(unscheduled.map(String))];

  return {
    entries,
    stats: {
      totalCourses: courses.length,
      scheduledCourses: courses.length - uniqueUnscheduled.length,
      unscheduledCourses: uniqueUnscheduled,
      backtrackSteps: totalSteps,
      generationTimeMs: Date.now() - startTime,
      conflictCount: 0,
    },
  };
}

/**
 * Detects clashes in an existing (already-saved) set of entries - used to
 * validate manual edits made by an admin after generation, since manual
 * drag-and-drop edits bypass the CSP solver's guarantees.
 */
export function detectClashes(entries) {
  const clashes = [];
  const byLecturer = new Map();
  const byVenue = new Map();
  const byGroup = new Map();

  entries.forEach((e) => {
    const slot = String(e.timeSlot?._id || e.timeSlot);
    const lecKey = `${e.lecturer?._id || e.lecturer}::${slot}`;
    const venKey = `${e.venue?._id || e.venue}::${slot}`;
    const groupKey = `${e.level?._id || e.level}_${e.programme?._id || e.programme || "none"}::${slot}`;

    if (byLecturer.has(lecKey)) clashes.push({ type: "lecturer", entries: [byLecturer.get(lecKey), e._id] });
    else byLecturer.set(lecKey, e._id);

    if (byVenue.has(venKey)) clashes.push({ type: "venue", entries: [byVenue.get(venKey), e._id] });
    else byVenue.set(venKey, e._id);

    if (byGroup.has(groupKey)) clashes.push({ type: "student", entries: [byGroup.get(groupKey), e._id] });
    else byGroup.set(groupKey, e._id);
  });

  return clashes;
}
