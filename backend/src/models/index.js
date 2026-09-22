import User from './User.js';
import Course from './Course.js';
import Lesson from './Lesson.js';
import Enrollment from './Enrollment.js';
import Test from './Test.js';
import TestQuestion from './TestQuestion.js';
import TestResult from './TestResult.js';
import Certificate from './Certificate.js';

User.hasMany(Course, { foreignKey: 'createdBy', as: 'createdCourses' });
Course.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons' });
Lesson.belongsTo(Course, { foreignKey: 'courseId' });

User.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'enrolledCourses',
});
Course.belongsToMany(User, {
  through: Enrollment,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'students',
});
Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// ✅ 1 COURSE = NHIỀU TEST
Course.hasMany(Test, { foreignKey: 'courseId', as: 'tests' });
Test.belongsTo(Course, { foreignKey: 'courseId' });

Test.hasMany(TestQuestion, { foreignKey: 'testId', as: 'questions' });
TestQuestion.belongsTo(Test, { foreignKey: 'testId' });

User.hasMany(TestResult, { foreignKey: 'studentId', as: 'testResults' });
TestResult.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Test.hasMany(TestResult, { foreignKey: 'testId', as: 'results' });
TestResult.belongsTo(Test, { foreignKey: 'testId' });

User.hasMany(Certificate, { foreignKey: 'studentId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
User.hasMany(Certificate, { foreignKey: 'issuedBy', as: 'issuedCertificates' });
Certificate.belongsTo(User, { foreignKey: 'issuedBy', as: 'issuer' });

export { User, Course, Lesson, Enrollment, Test, TestQuestion, TestResult, Certificate };