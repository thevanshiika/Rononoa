import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import { Project } from '../models/Project.ts';
import { Task } from '../models/Task.ts';
import { Comment } from '../models/Comment.ts';

export async function autoSeedIfEmpty() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`[Database] Database already populated (${userCount} users found). Skipping auto-seed.`);
    return;
  }

  console.log('[Database] Database is empty. Seeding realistic College Hackathon Demo Workspace...');
  await seedDatabase({ resetAll: true });
}

interface SeedOptions {
  resetAll?: boolean;
  retainCustomData?: boolean;
}

export async function seedDatabase(options: SeedOptions = { resetAll: true }) {
  const { retainCustomData = false } = options;

  if (!retainCustomData) {
    // Clear all existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
    ]);
  } else {
    // Retain custom user-created data (where isDemo is false or not set)
    await Promise.all([
      User.deleteMany({ isDemo: true }),
      Project.deleteMany({ isDemo: true }),
      Task.deleteMany({ isDemo: true }),
      Comment.deleteMany({}),
    ]);
  }

  const defaultPassword = 'Password123!';

  // 1. Create 7 Believable Demo Users (Clearly flagged as isDemo: true)
  const adminUser = new User({
    name: 'Alex Rivera',
    email: 'admin@company.com',
    password: defaultPassword,
    role: 'admin',
    status: 'active',
    title: 'Hackathon Director & Systems Lead',
    department: 'Computer Science Department',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const pmUser = new User({
    name: 'Sarah Chen',
    email: 'pm@company.com',
    password: defaultPassword,
    role: 'project_manager',
    status: 'active',
    title: 'Lead Student Tech Coordinator',
    department: 'Student Innovation Lab',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  });

  const devUser = new User({
    name: 'Marcus Vance',
    email: 'dev@company.com',
    password: defaultPassword,
    role: 'team_member',
    status: 'active',
    title: 'Senior Full Stack Engineer',
    department: 'Software Engineering Club',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  const viewerUser = new User({
    name: 'Elena Rostova',
    email: 'viewer@company.com',
    password: defaultPassword,
    role: 'viewer',
    status: 'active',
    title: 'Faculty Advisor & Hackathon Judge',
    department: 'Dean of Engineering',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  });

  const designerUser = new User({
    name: 'Liam Sato',
    email: 'designer@company.com',
    password: defaultPassword,
    role: 'team_member',
    status: 'active',
    title: 'Lead UI/UX Product Designer',
    department: 'Design & Human-Computer Interaction',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  });

  const qaUser = new User({
    name: 'Maya Patel',
    email: 'qa@company.com',
    password: defaultPassword,
    role: 'team_member',
    status: 'active',
    title: 'QA & Test Automation Specialist',
    department: 'Information Assurance Lab',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  });

  const cloudUser = new User({
    name: 'Devon Brooks',
    email: 'devon@company.com',
    password: defaultPassword,
    role: 'team_member',
    status: 'active',
    title: 'Cloud Infrastructure & DevOps Engineer',
    department: 'Campus Networking Services',
    isDemo: true,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  });

  await Promise.all([
    adminUser.save(),
    pmUser.save(),
    devUser.save(),
    viewerUser.save(),
    designerUser.save(),
    qaUser.save(),
    cloudUser.save(),
  ]);

  console.log('[Database] 7 realistic demo users created.');

  // 2. Create the 4 Requested College Projects
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  const nextTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const overdueDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Project 1: College Hackathon Platform
  const project1 = new Project({
    name: 'College Hackathon Platform',
    description: 'High-concurrency submission portal with automated rubric evaluations, multi-judge scoring rooms, and live leaderboard telemetry.',
    status: 'active',
    category: 'Hackathon Ops',
    color: '#4F46E5', // Indigo
    startDate: pastWeek,
    dueDate: nextTwoWeeks,
    manager: pmUser._id,
    isDemo: true,
    members: [
      { user: pmUser._id, role: 'manager', joinedAt: now },
      { user: devUser._id, role: 'contributor', joinedAt: now },
      { user: designerUser._id, role: 'contributor', joinedAt: now },
      { user: qaUser._id, role: 'reviewer', joinedAt: now },
      { user: cloudUser._id, role: 'contributor', joinedAt: now },
      { user: viewerUser._id, role: 'viewer', joinedAt: now },
    ],
  });

  // Project 2: Student Collaboration Portal
  const project2 = new Project({
    name: 'Student Collaboration Portal',
    description: 'Centralized academic networking hub enabling peer code reviews, shared digital study rooms, and cross-course project partner matchmaking.',
    status: 'active',
    category: 'EdTech & Campus',
    color: '#0284C7', // Sky Blue
    startDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
    dueDate: nextMonth,
    manager: pmUser._id,
    isDemo: true,
    members: [
      { user: pmUser._id, role: 'manager', joinedAt: now },
      { user: devUser._id, role: 'contributor', joinedAt: now },
      { user: designerUser._id, role: 'contributor', joinedAt: now },
      { user: viewerUser._id, role: 'viewer', joinedAt: now },
    ],
  });

  // Project 3: Portfolio Website Redesign
  const project3 = new Project({
    name: 'Portfolio Website Redesign',
    description: 'Modernizing student showcase portfolios with responsive Tailwind CSS, high-performance asset loading, interactive project carousels, and dark mode.',
    status: 'active',
    category: 'Web Design',
    color: '#9333EA', // Purple
    startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    manager: pmUser._id,
    isDemo: true,
    members: [
      { user: pmUser._id, role: 'manager', joinedAt: now },
      { user: designerUser._id, role: 'contributor', joinedAt: now },
      { user: devUser._id, role: 'contributor', joinedAt: now },
      { user: viewerUser._id, role: 'viewer', joinedAt: now },
    ],
  });

  // Project 4: Campus Event Management
  const project4 = new Project({
    name: 'Campus Event Management',
    description: 'End-to-end management for the annual Engineering Symposium: digital ticketing, schedule tracking, speaker sessions, and volunteer shifts.',
    status: 'planning',
    category: 'Event Systems',
    color: '#059669', // Emerald
    startDate: now,
    dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
    manager: pmUser._id,
    isDemo: true,
    members: [
      { user: pmUser._id, role: 'manager', joinedAt: now },
      { user: adminUser._id, role: 'manager', joinedAt: now },
      { user: qaUser._id, role: 'reviewer', joinedAt: now },
      { user: cloudUser._id, role: 'contributor', joinedAt: now },
      { user: viewerUser._id, role: 'viewer', joinedAt: now },
    ],
  });

  await Promise.all([project1.save(), project2.save(), project3.save(), project4.save()]);
  console.log('[Database] 4 College projects created.');

  // 3. Create 20 Realistic Tasks Distributed across Projects
  const tasks = [
    // --- Project 1: College Hackathon Platform (6 Tasks) ---
    new Task({
      title: 'Design Judge Rubric Evaluation Matrix',
      description: 'Define scoring criteria for Innovation (30%), Technical Execution (40%), Design (20%), and Presentation (10%) with slider controls.',
      project: project1._id,
      assignee: designerUser._id,
      creator: pmUser._id,
      status: 'done',
      priority: 'high',
      dueDate: pastWeek,
      version: 4,
      isDemo: true,
      tags: ['Rubric', 'UX', 'Scoring'],
      estimatedHours: 8,
    }),
    new Task({
      title: 'Implement Atomic Optimistic Concurrency on Submissions',
      description: 'Enforce task versioning and MongoDB atomic update checks to reject stale updates from concurrent judges scoring simultaneously.',
      project: project1._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'in_progress',
      priority: 'urgent',
      dueDate: overdueDate, // Intentionally overdue for testing
      version: 3,
      isDemo: true,
      tags: ['Backend', 'MongoDB', 'OCC', 'Concurrency'],
      estimatedHours: 16,
    }),
    new Task({
      title: 'Configure Zero-Downtime Docker Container Swarm',
      description: 'Provision self-scaling container cluster capable of handling 500+ simultaneous student repository submissions.',
      project: project1._id,
      assignee: cloudUser._id,
      creator: pmUser._id,
      status: 'in_review',
      priority: 'high',
      dueDate: nextTwoWeeks,
      version: 2,
      isDemo: true,
      tags: ['DevOps', 'Docker', 'Scaling'],
      estimatedHours: 12,
    }),
    new Task({
      title: 'Write Automated Test Suite for Submission Routes',
      description: 'Execute integration tests asserting HTTP 401 unauthenticated, 403 unauthorized, and 409 conflict edge cases.',
      project: project1._id,
      assignee: qaUser._id,
      creator: pmUser._id,
      status: 'in_progress',
      priority: 'medium',
      dueDate: nextTwoWeeks,
      version: 1,
      isDemo: true,
      tags: ['QA', 'IntegrationTests', 'Jest'],
      estimatedHours: 10,
    }),
    new Task({
      title: 'Live WebSocket Leaderboard Broadcast Engine',
      description: 'Stream realtime ranking changes to the auditorium projector displays when final scores are verified.',
      project: project1._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'todo',
      priority: 'high',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['WebSocket', 'Realtime', 'Frontend'],
      estimatedHours: 14,
    }),
    new Task({
      title: 'Export Evaluation Results to CSV & PDF Diplomas',
      description: 'Generate branded completion certificates for all participating collegiate teams with digital verification signatures.',
      project: project1._id,
      assignee: null,
      creator: pmUser._id,
      status: 'todo',
      priority: 'low',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['Reports', 'PDF'],
      estimatedHours: 6,
    }),

    // --- Project 2: Student Collaboration Portal (5 Tasks) ---
    new Task({
      title: 'Setup Peer Code Review Discussion Threads',
      description: 'Build syntax-highlighted code snippet viewers with line-by-line commenting and reviewer approval workflows.',
      project: project2._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'in_progress',
      priority: 'urgent',
      dueDate: nextTwoWeeks,
      version: 3,
      isDemo: true,
      tags: ['CodeReview', 'Collaboration'],
      estimatedHours: 18,
    }),
    new Task({
      title: 'Design Study Room Presence Indicators',
      description: 'Clean visual cues for active voice study rooms, participant caps, and subject categorization.',
      project: project2._id,
      assignee: designerUser._id,
      creator: pmUser._id,
      status: 'done',
      priority: 'medium',
      dueDate: pastWeek,
      version: 2,
      isDemo: true,
      tags: ['Figma', 'UI', 'Components'],
      estimatedHours: 8,
    }),
    new Task({
      title: 'Implement Course Subject Tagging & Filters',
      description: 'Allow students to filter collaboration requests by course code (e.g., CS-101, EE-240, MATH-214).',
      project: project2._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'in_review',
      priority: 'high',
      dueDate: nextTwoWeeks,
      version: 1,
      isDemo: true,
      tags: ['Search', 'Filters'],
      estimatedHours: 6,
    }),
    new Task({
      title: 'Sanitize Markdown Inputs Against XSS Attacks',
      description: 'Ensure student code snippets and discussion markdown are strictly sanitized before persisting to database.',
      project: project2._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'todo',
      priority: 'urgent',
      dueDate: nextTwoWeeks,
      version: 1,
      isDemo: true,
      tags: ['Security', 'Sanitization'],
      estimatedHours: 8,
    }),
    new Task({
      title: 'Schedule Weekly Office Hours Notifications',
      description: 'Integrate calendar reminder webhooks for teaching assistant availability.',
      project: project2._id,
      assignee: null,
      creator: pmUser._id,
      status: 'todo',
      priority: 'low',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['Calendar', 'Notifications'],
      estimatedHours: 5,
    }),

    // --- Project 3: Portfolio Website Redesign (5 Tasks) ---
    new Task({
      title: 'Build Dark Mode Theme Engine with Tailwind CSS',
      description: 'Implement system preference listener, high-contrast accessible surfaces, and smooth CSS transitions.',
      project: project3._id,
      assignee: designerUser._id,
      creator: pmUser._id,
      status: 'done',
      priority: 'medium',
      dueDate: pastWeek,
      version: 2,
      isDemo: true,
      tags: ['TailwindCSS', 'Accessibility', 'Theme'],
      estimatedHours: 12,
    }),
    new Task({
      title: 'Optimize Interactive Showcase Image Loading',
      description: 'Convert showcase mockups to responsive WebP with CSS skeleton placeholders matching exact container ratios.',
      project: project3._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'in_progress',
      priority: 'high',
      dueDate: nextTwoWeeks,
      version: 2,
      isDemo: true,
      tags: ['Performance', 'WebP', 'Skeletons'],
      estimatedHours: 10,
    }),
    new Task({
      title: 'Mobile Touch Gesture Navigation Audit',
      description: 'Verify 44px minimum touch targets and smooth horizontal carousel swipes on iOS and Android devices.',
      project: project3._id,
      assignee: designerUser._id,
      creator: pmUser._id,
      status: 'in_review',
      priority: 'medium',
      dueDate: nextTwoWeeks,
      version: 1,
      isDemo: true,
      tags: ['Mobile', 'Responsive', 'UX'],
      estimatedHours: 7,
    }),
    new Task({
      title: 'Integrate GitHub Activity Ticker & Showcase Links',
      description: 'Display live commit history and star counts for student open-source repositories.',
      project: project3._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'todo',
      priority: 'low',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['GitHubAPI', 'OpenSource'],
      estimatedHours: 6,
    }),
    new Task({
      title: 'SEO & Structured JSON-LD Meta Cards',
      description: 'Audit OpenGraph meta tags, Twitter card previews, and Schema.org rich snippets.',
      project: project3._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'todo',
      priority: 'medium',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['SEO', 'OpenGraph'],
      estimatedHours: 4,
    }),

    // --- Project 4: Campus Event Management (4 Tasks) ---
    new Task({
      title: 'Configure Digital QR Code Check-in Scanner',
      description: 'Mobile web camera QR code decoding for rapid volunteer check-in at the symposium entrance.',
      project: project4._id,
      assignee: devUser._id,
      creator: pmUser._id,
      status: 'in_progress',
      priority: 'high',
      dueDate: nextTwoWeeks,
      version: 1,
      isDemo: true,
      tags: ['QRCode', 'Scanner', 'Mobile'],
      estimatedHours: 14,
    }),
    new Task({
      title: 'Publish Keynote Speaker Schedule & Room Directory',
      description: 'Coordinate presentation tracks across Hall A, Innovation Auditorium, and Workshop Studio 3.',
      project: project4._id,
      assignee: qaUser._id,
      creator: adminUser._id,
      status: 'done',
      priority: 'high',
      dueDate: pastWeek,
      version: 3,
      isDemo: true,
      tags: ['Schedule', 'Speakers'],
      estimatedHours: 8,
    }),
    new Task({
      title: 'Volunteer Shift Roster & Emergency Broadcast',
      description: 'Assign student volunteers to 2-hour shifts with emergency SMS alert triggers.',
      project: project4._id,
      assignee: cloudUser._id,
      creator: pmUser._id,
      status: 'todo',
      priority: 'urgent',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['Volunteers', 'Alerts'],
      estimatedHours: 10,
    }),
    new Task({
      title: 'Catering & Dietary Requirements Aggregator',
      description: 'Summarize dietary restrictions (vegan, gluten-free, halal) for 350 attending attendees.',
      project: project4._id,
      assignee: null,
      creator: adminUser._id,
      status: 'todo',
      priority: 'low',
      dueDate: nextMonth,
      version: 1,
      isDemo: true,
      tags: ['Logistics'],
      estimatedHours: 4,
    }),
  ];

  await Task.insertMany(tasks);
  console.log('[Database] 20 realistic tasks seeded.');

  // 4. Create Meaningful Task Discussions / Comments
  const comments = [
    new Comment({
      task: tasks[1]._id, // Concurrency task
      project: project1._id,
      author: devUser._id,
      content: 'I verified the atomic $inc update logic against MongoDB. Stale version submissions return HTTP 409 Conflict with the fresh document payload.',
    }),
    new Comment({
      task: tasks[1]._id,
      project: project1._id,
      author: pmUser._id,
      content: 'Excellent Marcus! This prevents race conditions when judges score the same project at the same moment.',
    }),
    new Comment({
      task: tasks[1]._id,
      project: project1._id,
      author: viewerUser._id,
      content: 'Reviewed from the judging panel standpoint. The reload prompt looks intuitive for the faculty evaluators.',
    }),
    new Comment({
      task: tasks[6]._id, // Code review task
      project: project2._id,
      author: designerUser._id,
      content: 'Uploaded the diff viewer mockups with syntax color tokens matching JetBrains Mono font standards.',
    }),
    new Comment({
      task: tasks[6]._id,
      project: project2._id,
      author: devUser._id,
      content: 'Integrated into the student review panel. Clean layout and touch targets!',
    }),
    new Comment({
      task: tasks[11]._id, // Dark mode task
      project: project3._id,
      author: designerUser._id,
      content: 'Ensured all neutral surfaces maintain WCAG AA contrast (minimum 4.5:1 ratio).',
    }),
  ];

  await Comment.insertMany(comments);
  console.log('[Database] Realistic comments and discussions seeded.');
  console.log('[Database] Seeding process complete!');
}
