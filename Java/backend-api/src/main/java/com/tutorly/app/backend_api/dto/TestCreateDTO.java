package com.tutorly.app.backend_api.dto;

import java.time.LocalDate;

/**
 * Data Transfer Object for creating a new Test.
 *
 * <p>This DTO is used in REST API endpoints to accept test creation requests
 * with simplified data structures. Instead of requiring full entity objects, it accepts
 * simple IDs for related entities (tutor and student), reducing payload complexity and
 * preventing unnecessary data exposure.</p>
 *
 * <p>Design Rationale:
 * <ul>
 *   <li>Uses primitive IDs instead of entity references to avoid circular dependencies</li>
 *   <li>Each test is associated with exactly one tutor and one student</li>
 *   <li>Separates API contracts from database entity structure</li>
 *   <li>Mark supports half-point increments (e.g., 7.5, 8.5) on the 0-10 grading scale</li>
 * </ul>
 * </p>
 *
 * <p>Usage Example:
 * <pre>
 * TestCreateDTO dto = new TestCreateDTO();
 * dto.setDay(LocalDate.of(2026, 2, 16));
 * dto.setDescription("Mathematics quiz - linear equations");
 * dto.setMark(7.5);
 * dto.setTutorId(5L);
 * dto.setStudentId(10L);
 * </pre>
 * </p>
 *
 * @see com.tutorly.app.backend_api.entity.Test
 * @see com.tutorly.app.backend_api.controller.TestController
 * @author Tutorly Development Team
 * @version 1.0
 * @since 1.0
 */
public class TestCreateDTO {

    /**
     * Date when the test was administered.
     */
    private LocalDate day;

    /**
     * Description of the test content, subject, or assessment type.
     */
    private String description;

    /**
     * Test score or mark. Optional - can be null for ungraded tests.
     * Supports half-point increments (e.g., 7.5) on the 0-10 grading scale.
     */
    private Double mark;

    /**
     * Subject/topic the test covers (e.g., "Matematica", "Inglese"). Optional.
     */
    private String subject;

    /**
     * ID of the tutor who administered this test.
     */
    private Long tutorId;

    /**
     * ID of the student who took this test.
     */
    private Long studentId;


    // Constructors


    /**
     * Default no-argument constructor.
     * Required for JSON deserialization by Jackson and other serialization frameworks.
     */
    public TestCreateDTO() {
    }

    /**
     * Parameterized constructor for creating a fully initialized DTO.
     *
     * @param day Date the test was administered
     * @param description Test content description or subject
     * @param mark Test score or grade (can be null for ungraded tests)
     * @param subject Subject/topic the test covers (optional)
     * @param tutorId ID of the tutor who administered the test
     * @param studentId ID of the student who took the test
     */
    public TestCreateDTO(LocalDate day, String description, Double mark, String subject, Long tutorId, Long studentId) {
        this.day = day;
        this.description = description;
        this.mark = mark;
        this.subject = subject;
        this.tutorId = tutorId;
        this.studentId = studentId;
    }


    // Getters and Setters


    /**
     * Gets the date when the test was administered.
     *
     * @return The test date
     */
    public LocalDate getDay() {
        return day;
    }

    /**
     * Sets the date when the test was administered.
     *
     * @param day The test date
     */
    public void setDay(LocalDate day) {
        this.day = day;
    }

    /**
     * Gets the description of the test content or subject.
     *
     * @return The test description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the test content or subject.
     *
     * @param description The test description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the test score or mark.
     *
     * @return The test score, or null if not yet graded
     */
    public Double getMark() {
        return mark;
    }

    /**
     * Sets the test score or mark.
     *
     * @param mark The test score (can be null for ungraded tests)
     */
    public void setMark(Double mark) {
        this.mark = mark;
    }

    /**
     * Gets the subject/topic the test covers.
     *
     * @return The subject, or null if not provided
     */
    public String getSubject() {
        return subject;
    }

    /**
     * Sets the subject/topic the test covers.
     *
     * @param subject The subject name
     */
    public void setSubject(String subject) {
        this.subject = subject;
    }

    /**
     * Gets the ID of the tutor who administered this test.
     *
     * @return The tutor's user ID
     */
    public Long getTutorId() {
        return tutorId;
    }

    /**
     * Sets the ID of the tutor who administered this test.
     *
     * @param tutorId The tutor's user ID (must reference a user with TUTOR or STAFF role)
     */
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }

    /**
     * Gets the ID of the student who took this test.
     *
     * @return The student's user ID
     */
    public Long getStudentId() {
        return studentId;
    }

    /**
     * Sets the ID of the student who took this test.
     *
     * @param studentId The student's user ID
     */
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}
