import { prisma } from './db'

async function seed() {
  console.log('Seeding database...')

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@student.edu' },
    update: {},
    create: {
      id: 'demo-user-001',
      email: 'demo@student.edu',
      name: 'Demo Student',
    }
  })

  // Clean existing demo data
  await prisma.gradeItem.deleteMany({})
  await prisma.assignment.deleteMany({})
  await prisma.kanbanCard.deleteMany({})
  await prisma.kanbanColumn.deleteMany({})
  await prisma.kanbanBoard.deleteMany({})
  await prisma.note.deleteMany({})
  await prisma.event.deleteMany({})
  await prisma.classTime.deleteMany({})
  await prisma.course.deleteMany({})

  const now = new Date()
  const semesterStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const semesterEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1)

  // Create courses
  const cs101 = await prisma.course.create({
    data: {
      userId: user.id,
      name: 'Introduction to Computer Science',
      code: 'CS101',
      color: '#3B82F6',
      instructor: 'Dr. Sarah Chen',
      location: 'Building A, Room 301',
      creditHours: 4,
      startDate: semesterStart,
      endDate: semesterEnd,
      classTimes: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: 'A-301' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '10:30', location: 'A-301' },
        ]
      }
    }
  })

  const math201 = await prisma.course.create({
    data: {
      userId: user.id,
      name: 'Calculus II',
      code: 'MATH201',
      color: '#EF4444',
      instructor: 'Prof. Michael Torres',
      location: 'Building B, Room 205',
      creditHours: 4,
      startDate: semesterStart,
      endDate: semesterEnd,
      classTimes: {
        create: [
          { dayOfWeek: 2, startTime: '11:00', endTime: '12:30', location: 'B-205' },
          { dayOfWeek: 4, startTime: '11:00', endTime: '12:30', location: 'B-205' },
        ]
      }
    }
  })

  const eng105 = await prisma.course.create({
    data: {
      userId: user.id,
      name: 'Academic Writing',
      code: 'ENG105',
      color: '#10B981',
      instructor: 'Dr. Emily Watson',
      location: 'Building C, Room 102',
      creditHours: 3,
      startDate: semesterStart,
      endDate: semesterEnd,
      classTimes: {
        create: [
          { dayOfWeek: 1, startTime: '14:00', endTime: '15:30', location: 'C-102' },
          { dayOfWeek: 5, startTime: '14:00', endTime: '15:30', location: 'C-102' },
        ]
      }
    }
  })

  const phys150 = await prisma.course.create({
    data: {
      userId: user.id,
      name: 'Physics I',
      code: 'PHYS150',
      color: '#F59E0B',
      instructor: 'Dr. Robert Kim',
      location: 'Science Hall, Room 401',
      creditHours: 4,
      startDate: semesterStart,
      endDate: semesterEnd,
      classTimes: {
        create: [
          { dayOfWeek: 2, startTime: '09:00', endTime: '10:30', location: 'SH-401' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '10:30', location: 'SH-401' },
          { dayOfWeek: 5, startTime: '10:00', endTime: '12:00', location: 'Lab-3' },
        ]
      }
    }
  })

  // Create assignments
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  await prisma.assignment.createMany({
    data: [
      {
        userId: user.id,
        courseId: cs101.id,
        title: 'Programming Assignment 3: Sorting Algorithms',
        description: 'Implement merge sort, quick sort, and heap sort. Analyze time complexity.',
        dueDate: threeDaysFromNow,
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        estimatedMinutes: 300,
      },
      {
        userId: user.id,
        courseId: math201.id,
        title: 'Problem Set 5: Integration Techniques',
        description: 'Problems 1-20 from Chapter 7. Show all work.',
        dueDate: tomorrow,
        type: 'ASSIGNMENT',
        priority: 'URGENT',
        estimatedMinutes: 180,
      },
      {
        userId: user.id,
        courseId: eng105.id,
        title: 'Research Paper Draft',
        description: 'First draft of the argumentative essay. Minimum 1500 words.',
        dueDate: oneWeekFromNow,
        type: 'PAPER',
        priority: 'MEDIUM',
        estimatedMinutes: 600,
      },
      {
        userId: user.id,
        courseId: phys150.id,
        title: 'Lab Report: Projectile Motion',
        description: 'Complete the lab report with data analysis and error calculations.',
        dueDate: twoWeeksFromNow,
        type: 'LAB',
        priority: 'MEDIUM',
        estimatedMinutes: 240,
      },
      {
        userId: user.id,
        courseId: cs101.id,
        title: 'Midterm Exam',
        description: 'Covers chapters 1-5. Closed book.',
        dueDate: oneWeekFromNow,
        type: 'EXAM',
        priority: 'HIGH',
        estimatedMinutes: 120,
      },
      {
        userId: user.id,
        courseId: math201.id,
        title: 'Quiz 4: Series Convergence',
        description: 'In-class quiz on convergence tests.',
        dueDate: threeDaysFromNow,
        type: 'QUIZ',
        priority: 'HIGH',
        estimatedMinutes: 60,
      },
    ]
  })

  // Create grade items
  await prisma.gradeItem.createMany({
    data: [
      { courseId: cs101.id, name: 'Homework 1', category: 'Homework', weight: 10, score: 92, maxScore: 100 },
      { courseId: cs101.id, name: 'Homework 2', category: 'Homework', weight: 10, score: 88, maxScore: 100 },
      { courseId: cs101.id, name: 'Programming Assignment 1', category: 'Projects', weight: 15, score: 95, maxScore: 100 },
      { courseId: cs101.id, name: 'Programming Assignment 2', category: 'Projects', weight: 15, score: null, maxScore: 100 },
      { courseId: cs101.id, name: 'Midterm Exam', category: 'Exams', weight: 20, score: null, maxScore: 100 },
      { courseId: cs101.id, name: 'Final Exam', category: 'Exams', weight: 20, score: null, maxScore: 100 },
      { courseId: cs101.id, name: 'Participation', category: 'Participation', weight: 10, score: 100, maxScore: 100 },

      { courseId: math201.id, name: 'Problem Set 1', category: 'Homework', weight: 8, score: 85, maxScore: 100 },
      { courseId: math201.id, name: 'Problem Set 2', category: 'Homework', weight: 8, score: 90, maxScore: 100 },
      { courseId: math201.id, name: 'Problem Set 3', category: 'Homework', weight: 8, score: 78, maxScore: 100 },
      { courseId: math201.id, name: 'Problem Set 4', category: 'Homework', weight: 8, score: null, maxScore: 100 },
      { courseId: math201.id, name: 'Quiz 1', category: 'Quizzes', weight: 5, score: 88, maxScore: 100 },
      { courseId: math201.id, name: 'Quiz 2', category: 'Quizzes', weight: 5, score: 92, maxScore: 100 },
      { courseId: math201.id, name: 'Quiz 3', category: 'Quizzes', weight: 5, score: null, maxScore: 100 },
      { courseId: math201.id, name: 'Midterm Exam', category: 'Exams', weight: 25, score: null, maxScore: 100 },
      { courseId: math201.id, name: 'Final Exam', category: 'Exams', weight: 25, score: null, maxScore: 100 },
      { courseId: math201.id, name: 'Participation', category: 'Participation', weight: 3, score: 95, maxScore: 100 },

      { courseId: eng105.id, name: 'Essay 1', category: 'Writing', weight: 15, score: 87, maxScore: 100 },
      { courseId: eng105.id, name: 'Essay 2', category: 'Writing', weight: 20, score: null, maxScore: 100 },
      { courseId: eng105.id, name: 'Research Paper', category: 'Writing', weight: 25, score: null, maxScore: 100 },
      { courseId: eng105.id, name: 'Peer Reviews', category: 'Participation', weight: 15, score: 95, maxScore: 100 },
      { courseId: eng105.id, name: 'Discussion Posts', category: 'Participation', weight: 10, score: 90, maxScore: 100 },
      { courseId: eng105.id, name: 'Final Portfolio', category: 'Writing', weight: 15, score: null, maxScore: 100 },

      { courseId: phys150.id, name: 'Lab Report 1', category: 'Labs', weight: 10, score: 90, maxScore: 100 },
      { courseId: phys150.id, name: 'Lab Report 2', category: 'Labs', weight: 10, score: 85, maxScore: 100 },
      { courseId: phys150.id, name: 'Lab Report 3', category: 'Labs', weight: 10, score: null, maxScore: 100 },
      { courseId: phys150.id, name: 'Lab Report 4', category: 'Labs', weight: 10, score: null, maxScore: 100 },
      { courseId: phys150.id, name: 'Midterm Exam', category: 'Exams', weight: 25, score: null, maxScore: 100 },
      { courseId: phys150.id, name: 'Final Exam', category: 'Exams', weight: 25, score: null, maxScore: 100 },
      { courseId: phys150.id, name: 'Homework', category: 'Homework', weight: 10, score: 82, maxScore: 100 },
    ]
  })

  // Create events
  await prisma.event.createMany({
    data: [
      {
        userId: user.id,
        title: 'CS Study Group',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 30),
        type: 'STUDY',
        location: 'Library Room 202'
      },
      {
        userId: user.id,
        title: 'Math Tutoring Session',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0),
        type: 'STUDY',
        location: 'Tutoring Center'
      },
      {
        userId: user.id,
        title: 'Career Fair',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0),
        type: 'GENERAL',
        location: 'Student Center'
      },
    ]
  })

  // Create kanban board for CS101
  const csBoard = await prisma.kanbanBoard.create({
    data: {
      userId: user.id,
      courseId: cs101.id,
      name: 'CS101 Project Board',
      columns: {
        create: [
          { name: 'To Do', order: 0, color: '#FEE2E2' },
          { name: 'In Progress', order: 1, color: '#FEF3C7' },
          { name: 'Code Review', order: 2, color: '#DBEAFE' },
          { name: 'Done', order: 3, color: '#D1FAE5' },
        ]
      }
    },
    include: { columns: true }
  })

  const todoCol = csBoard.columns.find(c => c.name === 'To Do')!
  const inProgressCol = csBoard.columns.find(c => c.name === 'In Progress')!
  const doneCol = csBoard.columns.find(c => c.name === 'Done')!

  await prisma.kanbanCard.createMany({
    data: [
      { columnId: inProgressCol.id, title: 'Implement merge sort', description: 'Write the merge sort algorithm in Python', order: 0 },
      { columnId: inProgressCol.id, title: 'Implement quick sort', description: 'Write the quick sort algorithm with randomized pivot', order: 1 },
      { columnId: todoCol.id, title: 'Implement heap sort', description: 'Build a max heap and implement heap sort', order: 0, dueDate: threeDaysFromNow },
      { columnId: todoCol.id, title: 'Complexity analysis', description: 'Write Big-O analysis for all three algorithms', order: 1, dueDate: threeDaysFromNow },
      { columnId: doneCol.id, title: 'Setup development environment', description: 'Install Python and set up project structure', order: 0 },
    ]
  })

  // Create notes
  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        courseId: cs101.id,
        title: 'Sorting Algorithms Summary',
        content: 'Merge Sort: O(n log n) always. Stable. Requires O(n) extra space.\n\nQuick Sort: O(n log n) average, O(n²) worst case. In-place (mostly). Not stable.\n\nHeap Sort: O(n log n) always. In-place. Not stable.\n\nKey insight: Merge sort is preferred for linked lists. Quick sort is fastest in practice for arrays.',
        tags: '["algorithms", "sorting", "big-o"]'
      },
      {
        userId: user.id,
        courseId: math201.id,
        title: 'Integration by Parts Trick',
        content: 'LIATE rule for choosing u:\nL - Logarithmic\nI - Inverse trig\nA - Algebraic\nT - Trigonometric\nE - Exponential\n\nPick u in order of priority from top to bottom.',
        tags: '["calculus", "integration", "tips"]'
      },
      {
        userId: user.id,
        title: 'Weekly Goals',
        content: '1. Complete Math Problem Set 5\n2. Start CS Programming Assignment 3\n3. Read 3 papers for Eng research\n4. Review physics lab procedures\n5. Attend 2 study group sessions',
      },
    ]
  })

  console.log('Seed complete!')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
