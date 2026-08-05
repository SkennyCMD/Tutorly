package com.tutorly.app.backend_api.service;

import com.tutorly.app.backend_api.entity.Lesson;
import com.tutorly.app.backend_api.entity.Pack;
import com.tutorly.app.backend_api.repository.PackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Pack entity business logic
 *
 * Provides business logic and operations for lesson-package management.
 * Acts as an intermediary between the controller layer and repository layer.
 */
@Service
public class PackService {

    @Autowired
    private PackRepository packRepository;

    @Autowired
    private LessonService lessonService;

    /**
     * Retrieve all packs
     *
     * @return List of all packs in the system
     */
    public List<Pack> getAllPacks() {
        return packRepository.findAll();
    }

    /**
     * Find a pack by ID
     *
     * @param id The pack ID to search for
     * @return Optional containing the pack if found, empty otherwise
     */
    public Optional<Pack> getPackById(Long id) {
        return packRepository.findById(id);
    }

    /**
     * Find all packs belonging to a specific student
     *
     * @param studentId The student ID to search for
     * @return List of packs for the specified student
     */
    public List<Pack> getPacksByStudent(Long studentId) {
        return packRepository.findByStudent_Id(studentId);
    }

    /**
     * Find the active pack a new lesson for this student should be drawn from, if any.
     *
     * A pack is eligible if: it has no closure date, the lesson's start time is after
     * the pack's start time (a lesson can't be drawn from a pack that hasn't started yet),
     * and the total duration of lessons already drawn from it is less than its purchased
     * hours. When a student has more than one eligible pack, the one with the earliest
     * start time is chosen (oldest pack is used up first).
     *
     * @param studentId The student ID to search for
     * @param lessonStartTime The start time of the lesson being created
     * @return Optional containing the eligible pack, empty if none found
     */
    public Optional<Pack> findActivePackWithAvailableHours(Long studentId, LocalDateTime lessonStartTime) {
        List<Pack> packs = packRepository.findByStudent_Id(studentId);
        return packs.stream()
                .filter(pack -> pack.getClosure() == null)
                .filter(pack -> lessonStartTime.isAfter(pack.getStartTime()))
                .filter(pack -> getUsedHours(pack) < pack.getHours())
                .min(Comparator.comparing(Pack::getStartTime));
    }

    /**
     * Computes the total hours already drawn from a pack by its associated lessons.
     *
     * @param pack The pack to compute used hours for
     * @return Sum of the durations (in hours) of all lessons linked to this pack
     */
    public double getUsedHours(Pack pack) {
        return lessonService.getLessonsByPack(pack.getId()).stream()
                .mapToDouble(lesson -> Duration.between(lesson.getStartTime(), lesson.getEndTime()).toMinutes() / 60.0)
                .sum();
    }

    /**
     * Computes hours the student has done outside of this pack since it started.
     *
     * These are lessons for the same student, not drawn from any pack, that started
     * after this pack did - i.e. lessons booked once the pack ran out of hours and
     * no other active pack was available to absorb them.
     *
     * @param pack The pack to compute unassigned hours for
     * @return Sum of the durations (in hours) of the student's pack-less lessons since this pack started
     */
    public double getHoursOutsidePack(Pack pack) {
        return lessonService.getLessonsWithNoPackAfter(pack.getStudentId(), pack.getStartTime()).stream()
                .mapToDouble(lesson -> Duration.between(lesson.getStartTime(), lesson.getEndTime()).toMinutes() / 60.0)
                .sum();
    }

    /**
     * Finds the start time of the earliest lesson the student has done outside of this pack.
     *
     * Used to pre-fill a new pack's start date/time with the moment the student started
     * accumulating unassigned hours, so the new pack can absorb them retroactively.
     *
     * @param pack The pack to search unassigned lessons for
     * @return Optional containing the earliest unassigned lesson's start time, empty if none
     */
    public Optional<LocalDateTime> getFirstUnassignedLessonStart(Pack pack) {
        return lessonService.getLessonsWithNoPackAfter(pack.getStudentId(), pack.getStartTime()).stream()
                .map(Lesson::getStartTime)
                .min(LocalDateTime::compareTo);
    }

    /**
     * Retroactively draws any of the student's unassigned lessons into a newly created pack.
     *
     * Finds lessons for the pack's student that aren't drawn from any pack and started at
     * or after the pack's own start time, and assigns them to this pack (in chronological
     * order, stopping once the pack runs out of hours). Run right after a pack is created
     * so it can absorb hours the student already did before the pack existed (e.g. lessons
     * booked once a previous pack ran out).
     *
     * @param pack The newly created pack to assign unassigned lessons to
     */
    public void assignUnassignedLessonsSince(Pack pack) {
        List<Lesson> lessons = lessonService.getLessonsWithNoPackFrom(pack.getStudentId(), pack.getStartTime());
        lessons.sort(Comparator.comparing(Lesson::getStartTime));
        for (Lesson lesson : lessons) {
            if (getUsedHours(pack) >= pack.getHours()) {
                break;
            }
            assignLessonToPack(pack, lesson);
        }
    }

    /**
     * Assigns a lesson to a pack, splitting the lesson if it only partially fits.
     *
     * If the lesson's full duration fits within the pack's remaining hours, the whole
     * lesson is drawn from the pack. Otherwise the lesson is split in two: the portion
     * that fits (starting at the lesson's original start time) is drawn from the pack,
     * and the remainder (a new lesson covering the rest of the original time range) is
     * left unassigned, exactly as if it had been booked outside any pack.
     *
     * @param pack The pack to draw the lesson from
     * @param lesson The lesson to assign (with startTime/endTime already set)
     * @return The saved lesson representing the portion drawn from the pack
     */
    public Lesson assignLessonToPack(Pack pack, Lesson lesson) {
        double remaining = pack.getHours() - getUsedHours(pack);
        double durationHours = Duration.between(lesson.getStartTime(), lesson.getEndTime()).toMinutes() / 60.0;

        if (durationHours <= remaining) {
            lesson.setPack(pack);
            return lessonService.saveLesson(lesson);
        }

        // Partial fit: split into the part that fits the pack and the remainder outside it
        LocalDateTime splitPoint = lesson.getStartTime().plusMinutes(Math.round(remaining * 60));
        LocalDateTime originalEnd = lesson.getEndTime();

        Lesson remainderLesson = new Lesson(lesson.getDescription(), splitPoint, originalEnd, lesson.getTutor(), lesson.getStudent());
        lessonService.saveLesson(remainderLesson);

        lesson.setEndTime(splitPoint);
        lesson.setPack(pack);
        return lessonService.saveLesson(lesson);
    }

    /**
     * Save or update a pack
     *
     * Creates a new pack if ID is null, updates existing pack otherwise.
     *
     * @param pack The pack entity to save
     * @return The saved pack entity with generated ID (if new)
     */
    public Pack savePack(Pack pack) {
        return packRepository.save(pack);
    }

    /**
     * Delete a pack by ID
     *
     * @param id The ID of the pack to delete
     */
    public void deletePack(Long id) {
        packRepository.deleteById(id);
    }
}
