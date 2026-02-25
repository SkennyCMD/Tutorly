# 🤝 Contributing Guide

Guidelines for contributing to the Tutorly project.

---

**Document**: 10_Contributing_Guide.md  
**Last Updated**: February 25, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Welcome](#welcome)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

---

## Welcome

Thank you for considering contributing to Tutorly! This document provides guidelines and best practices for contributing to the project.

### Ways to Contribute

- 🐛 **Bug Reports**: Report issues you encounter
- ✨ **Feature Requests**: Suggest new features
- 📝 **Documentation**: Improve or translate documentation
- 🔧 **Code Contributions**: Fix bugs or implement features
- 🧪 **Testing**: Write or improve tests
- 💡 **Ideas**: Share ideas and participate in discussions

---

## Code of Conduct

### Our Standards

**Positive behavior includes:**
- Using welcoming language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of unacceptable behavior may be reported to skenny.dev@gmail.com. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- ✅ Git installed and configured
- ✅ Java 21 JDK
- ✅ Node.js 18+
- ✅ PostgreSQL 12+
- ✅ Maven 3.8+
- ✅ A code editor (VS Code, IntelliJ IDEA, etc.)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/Tutorly.git
cd Tutorly

# Add upstream remote
git remote add upstream https://github.com/original-owner/Tutorly.git

# Verify remotes
git remote -v
```

### Install Dependencies

```bash
# Java Backend
cd Java/backend-api
mvn clean install

# Node.js Frontend
cd ../../Nodejs
npm install
```

### Create Development Database

```bash
# Create development database
createdb tutorly_db

# Configure database credentials
# Edit Java/backend-api/src/main/resources/application.properties
# Edit Nodejs/server_utilities/config.js
```

### Run Development Servers

```bash
# Terminal 1: Start Java Backend
cd Java/backend-api
mvn spring-boot:run

# Terminal 2: Start Node.js Frontend
cd Nodejs
npm run dev
```

---

## Development Workflow

### ⚠️ Important: Issue-First Approach

**Before starting any work, you MUST open an issue first!**

This ensures:
- Your work aligns with project goals
- No duplicate efforts
- Discussion on the best approach
- Staff approval before investing time

#### Steps:

1. **Search existing issues** to avoid duplicates
2. **Open a new issue** describing:
   - **Bug**: Steps to reproduce, expected vs actual behavior
   - **Feature**: Use case, proposed solution, alternatives considered
3. **Wait for staff approval** before starting work
4. **Reference the issue** in your branch name and commits

**Example Issue Titles:**
- `[BUG] Login fails with special characters in password`
- `[FEATURE] Add export lessons to PDF functionality`
- `[DOCS] Improve installation guide for Windows`

⚠️ **Pull Requests without an associated approved issue may be closed.**

---

### 1. Create a Branch

After receiving approval on your issue, create a new branch for your work:

```bash
# Update your local main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

**Always include the issue number in your branch name!**

- `feature/123-feature-name` - New features (issue #123)
- `fix/456-bug-name` - Bug fixes (issue #456)
- `docs/789-topic` - Documentation updates (issue #789)
- `refactor/component` - Code refactoring
- `test/component` - Test additions/improvements
- `chore/task` - Maintenance tasks

**Example:**
```bash
# For issue #42: Add student search by class
git checkout -b feature/42-student-search-by-class
```

### 2. Make Changes

- Write clean, readable code
- Follow the project's code style
- Add tests for new functionality
- Update documentation as needed
- Keep commits atomic and focused

### 3. Test Your Changes

```bash
# Run Java tests
cd Java/backend-api
mvn test

# Run Node.js tests
cd Nodejs
npm test

# Manual testing
# Test the application thoroughly in your browser
```

### 4. Commit Your Changes

```bash
# Stage changed files
git add .

# Commit with meaningful message
git commit -m "feat: add student search by class"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. **Verify your issue was approved** by a staff member
2. Go to your fork on GitHub
3. Click "New Pull Request"
4. Select your branch
5. Fill in the PR template
6. **Link the issue** in the PR description (e.g., "Closes #42")
7. Submit for review

**Important:** PRs without an approved issue will be closed!

---

## Code Style Guidelines

### Java Code Style

#### General Principles

- Follow Java naming conventions
- Use meaningful variable names
- Keep methods small and focused
- Add JavaDoc comments for public APIs
- Maximum line length: 120 characters

#### Example

```java
/**
 * Retrieves a student by their unique identifier.
 *
 * @param id the student's ID
 * @return the Student entity
 * @throws StudentNotFoundException if student not found
 */
public Student getStudentById(Long id) {
    return studentRepository.findById(id)
        .orElseThrow(() -> new StudentNotFoundException(
            "Student not found with id: " + id
        ));
}
```

#### Formatting

- **Indentation**: 4 spaces
- **Braces**: K&R style (opening brace on same line)
- **Imports**: Group by package, no wildcards
- **Annotations**: One per line

```java
// Good
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Transactional
    public Student createStudent(Student student) {
        // Implementation
    }
}
```

### JavaScript/Node.js Code Style

#### General Principles

- Use ES6+ features where appropriate
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Add JSDoc comments for functions

#### Example

```javascript
/**
 * Authenticates a tutor with username and password
 * @param {string} username - The tutor's username
 * @param {string} password - The plain text password
 * @returns {Promise<Object|null>} Tutor data or null if authentication fails
 */
async function authenticateTutor(username, password) {
    const tutors = await javaApiService.getAllTutors();
    const tutor = tutors.find(t => t.username === username);
    
    if (!tutor) {
        return null;
    }
    
    const isValid = await passwordService.comparePassword(
        password, 
        tutor.password
    );
    
    return isValid ? { tutorId: tutor.id, tutorData: tutor } : null;
}
```

#### Formatting

- **Indentation**: 4 spaces (or 2 spaces, be consistent)
- **Semicolons**: Use them
- **Quotes**: Single quotes for strings
- **Line length**: 80-100 characters

### SQL/Database

```sql
-- Use uppercase for SQL keywords
-- Use lowercase with underscores for table/column names
SELECT 
    s.id,
    s.name,
    s.surname,
    s.classe
FROM student s
WHERE s.classe = '3A'
ORDER BY s.surname, s.name;
```

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)
- **perf**: Performance improvements

### Examples

```bash
# Simple commit
git commit -m "feat: add student search functionality"

# With scope
git commit -m "fix(auth): resolve session expiration issue"

# With body
git commit -m "refactor(api): improve error handling

- Add centralized exception handler
- Return consistent error responses
- Add detailed error logging"

# Breaking change
git commit -m "feat!: change API authentication method

BREAKING CHANGE: API now requires JWT tokens instead of API keys.
Update your client applications accordingly."
```

### Rules

1. Use imperative mood ("add" not "added" or "adds")
2. Don't capitalize first letter
3. No period at the end
4. Keep subject line under 50 characters
5. Separate subject from body with blank line
6. Wrap body at 72 characters
7. Use body to explain what and why, not how

---

## Pull Request Process

### 🚨 MANDATORY REQUIREMENT

**All Pull Requests MUST have an associated approved issue!**

**Process:**
1. ✅ Open an issue describing your proposed changes
2. ✅ Wait for approval from a staff member
3. ✅ Implement your changes in a feature branch
4. ✅ Create PR linking to the approved issue

**PRs submitted without an approved issue will be closed without review.**

This policy ensures:
- Alignment with project roadmap
- No wasted effort on rejected features
- Proper discussion before implementation
- Quality and consistency across contributions

---

### Before Submitting

- [ ] Branch is up to date with main
- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] No merge conflicts

### PR Template

When creating a PR, include:

```markdown
## Related Issue
Closes #[issue-number]

## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] This PR links to an approved issue
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

### Review Process

1. **Automated Checks**: GitHub Actions must pass
2. **Code Review**: At least one maintainer approval required
3. **Discussion**: Address reviewer comments
4. **Updates**: Push additional commits as needed
5. **Merge**: Maintainer will merge when approved

### After Merge

```bash
# Update your local main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Testing Requirements

### Minimum Coverage

- **Backend**: 70% code coverage
- **Frontend**: 60% code coverage
- **Critical paths**: 100% coverage

### Test Types Required

#### For Backend Changes

- [ ] Unit tests for new services/repositories
- [ ] Integration tests for API endpoints
- [ ] Test both success and error cases

```java
@Test
void shouldCreateStudent() {
    // Arrange
    Student student = new Student();
    student.setName("John");
    
    // Act
    Student created = studentService.createStudent(student);
    
    // Assert
    assertNotNull(created.getId());
    assertEquals("John", created.getName());
}

@Test
void shouldThrowExceptionForInvalidStudent() {
    // Arrange
    Student invalidStudent = new Student(); // Missing required fields
    
    // Act & Assert
    assertThrows(ValidationException.class, () -> {
        studentService.createStudent(invalidStudent);
    });
}
```

#### For Frontend Changes

- [ ] Unit tests for utility functions
- [ ] Integration tests for routes
- [ ] Test authentication/authorization

```javascript
describe('authenticateTutor', () => {
    it('should return tutor data for valid credentials', async () => {
        const result = await authService.authenticateTutor('tutor1', 'pass123');
        
        expect(result).not.toBeNull();
        expect(result.tutorData.username).toBe('tutor1');
    });
    
    it('should return null for invalid credentials', async () => {
        const result = await authService.authenticateTutor('invalid', 'wrong');
        
        expect(result).toBeNull();
    });
});
```

---

## Documentation Standards

### Code Documentation

#### Java (JavaDoc)

```java
/**
 * Service class for managing student operations.
 * Provides methods for CRUD operations and student queries.
 *
 * @author Tutorly Team
 * @version 1.0
 * @since 2026-01-15
 */
public class StudentService {
    
    /**
     * Retrieves all students in a specific class.
     *
     * @param className the name of the class (e.g., "3A")
     * @return list of students in the class
     * @throws IllegalArgumentException if className is null or empty
     */
    public List<Student> getStudentsByClass(String className) {
        // Implementation
    }
}
```

#### JavaScript (JSDoc)

```javascript
/**
 * Hashes a plain text password using bcrypt
 * @param {string} password - The plain text password to hash
 * @param {number} [saltRounds=10] - Number of salt rounds for bcrypt
 * @returns {Promise<string>} The hashed password
 * @throws {Error} If password is empty or hashing fails
 * @example
 * const hash = await hashPassword('myPassword123');
 * console.log(hash); // $2b$10$...
 */
async function hashPassword(password, saltRounds = 10) {
    // Implementation
}
```

### Markdown Documentation

- Use clear, concise language
- Include code examples
- Add table of contents for long documents
- Use proper heading hierarchy (H1 → H2 → H3)
- Include navigation links (Previous/Next)

---

## Issue Reporting

### Issue Lifecycle

**All contributions must start with an issue!**

#### Process:
1. **Search existing issues** - Check if your issue already exists
2. **Create new issue** - Use the appropriate template
3. **Add labels** - Tag with `bug`, `feature`, `documentation`, etc.
4. **Wait for review** - A staff member will review and respond
5. **Receive approval** - Look for `approved` label or explicit approval comment
6. **Start work** - Only after approval, create your branch and begin coding

**Timeline**: Expect response within 2-5 business days.

**Labels:**
- 🐛 `bug` - Something isn't working
- ✨ `feature` - New feature or enhancement
- 📝 `documentation` - Documentation improvement
- ❓ `question` - Question or discussion
- 🔥 `priority:high` - Urgent issue
- ⏸️ `on-hold` - Waiting for more information
- ✅ `approved` - Ready for implementation (assigned by staff)
- ❌ `wontfix` - Will not be implemented

---

### Bug Reports

Use this template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Java Version: [e.g., 21]
- Node Version: [e.g., 18.17]

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

**⚠️ Important:** After submitting, wait for a staff member to review and approve your issue before starting any work!

---

### Feature Requests

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How would you implement this?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Any other relevant information
```

**⚠️ Important:** Feature requests require staff approval before implementation. Wait for the `approved` label!

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: skenny.dev@gmail.com for direct contact

### Getting Help

1. Check existing documentation
2. Search closed issues for similar problems
3. Ask in GitHub Discussions
4. Create a new issue with detailed information

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated in project documentation

---

## 📋 Complete Contribution Workflow

Here's the complete workflow from idea to merged code:

```
1️⃣  OPEN ISSUE
    ├─ Search existing issues
    ├─ Create new issue with template
    ├─ Add appropriate labels
    └─ Describe problem/feature clearly
    
            ⬇️
    
2️⃣  WAIT FOR APPROVAL
    ├─ Staff reviews issue (2-5 days)
    ├─ Discussion/clarifications
    └─ Look for `approved` label
    
            ⬇️
            
3️⃣  FORK & BRANCH
    ├─ Fork repository
    ├─ Create branch: feature/123-description
    └─ Reference issue number in branch name
    
            ⬇️
            
4️⃣  IMPLEMENT CHANGES
    ├─ Write code following style guidelines
    ├─ Add/update tests
    ├─ Update documentation
    └─ Test thoroughly
    
            ⬇️
            
5️⃣  COMMIT & PUSH
    ├─ Commit with conventional messages
    ├─ Reference issue in commits
    └─ Push to your fork
    
            ⬇️
            
6️⃣  CREATE PULL REQUEST
    ├─ Fill PR template completely
    ├─ Link to approved issue ("Closes #123")
    ├─ Wait for automated checks
    └─ Address review comments
    
            ⬇️
            
7️⃣  CODE REVIEW
    ├─ Staff reviews code
    ├─ Discussion/changes requested
    ├─ Make updates if needed
    └─ Approval from maintainer
    
            ⬇️
            
8️⃣  MERGE ✅
    └─ Maintainer merges PR
    └─ Your contribution is live!
```

**Key Points:**
- ⚠️ **NO PR without approved issue** - Will be closed
- ⏱️ Response time: 2-5 business days
- 🔗 Always link issue in PR (e.g., "Closes #42")
- ✅ Wait for `approved` label before starting work

---

## Quick Reference

### Contribution Workflow Summary

```bash
# Step 1: Open issue and wait for approval on GitHub

# Step 2: Fork and setup (one-time)
git clone https://github.com/YOUR-USERNAME/Tutorly.git
cd Tutorly
git remote add upstream https://github.com/original-owner/Tutorly.git

# Step 3: Create feature branch (after issue approval!)
git checkout main
git pull upstream main
git checkout -b feature/123-issue-description  # Use issue number!

# Step 4: Make changes, test, and commit
# ... make your changes ...
git add .
git commit -m "feat: description (refs #123)"

# Step 5: Push and create PR
git push origin feature/123-issue-description
# Then create PR on GitHub linking to issue #123
```

### Common Commands

```bash
# Update from upstream
git pull upstream main

# Create feature branch
git checkout -b feature/my-feature

# Run all tests
cd Java/backend-api && mvn test
cd Nodejs && npm test

# Check code style
mvn checkstyle:check  # Java
npm run lint          # Node.js

# Build for production
mvn clean package     # Java
npm run build         # Node.js (if applicable)
```

### Need Help?

- 📚 Read the [documentation](README.md)
- 💬 Ask in GitHub Discussions
- 📧 Email: skenny.dev@gmail.com

---

## ⚠️ Remember

**Before submitting ANY Pull Request:**

1. ✅ Issue must exist and be approved by staff
2. ✅ Branch name must reference issue number (e.g., `feature/42-description`)
3. ✅ PR description must link issue (e.g., "Closes #42")
4. ✅ All tests must pass
5. ✅ Code must follow style guidelines

**Pull Requests without an approved issue will be closed immediately.**

This policy protects both your time and the project's quality. Thank you for understanding! 🙏

---

**Navigation**  
⬅️ **Previous**: [09_Deployment_Guide.md](09_Deployment_Guide.md) | **Next**: [11_Glossary.md](11_Glossary.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: February 25, 2026
