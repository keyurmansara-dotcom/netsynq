import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Job from './models/Job.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const JOB_TYPES = ['Full-time', 'Part-time'];
const SKILLS_POOL = [
  'React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'JavaScript',
  'Python', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Tailwind CSS',
  'GraphQL', 'Redis', 'Next.js', 'PostgreSQL', 'CI/CD', 'REST APIs', 'Git'
];

const generateSampleJobs = (count = 15) => {
  return Array.from({ length: count }, () => ({
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    description: faker.lorem.paragraph(),
    skillsRequired: faker.helpers.arrayElements(
      SKILLS_POOL,
      faker.number.int({ min: 3, max: 6 })
    ),
    type: faker.helpers.arrayElement(JOB_TYPES)
  }));
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    // Job requires a 'recruiter' which is a User ID. 
    // Let's find the first user in the DB to act as the recruiter.
    let user = await User.findOne({});
    
    if (!user) {
      console.log('No user found in the database. Creating a dummy user to act as recruiter...');
      user = await User.create({
        name: "Admin Recruiter",
        email: "admin@recruiter.com",
        password: "hashedpassword123", // Dummy
      });
    }

    const sampleJobs = generateSampleJobs(15);

    // Attach the recruiter ID to all sample jobs
    const jobsToInsert = sampleJobs.map(job => ({ ...job, recruiter: user._id }));

    // Optional: Clear existing jobs before inserting to avoid duplicates running this multiple times
    // await Job.deleteMany({}); 

    await Job.insertMany(jobsToInsert);
    console.log(`✅ ${jobsToInsert.length} sample jobs inserted successfully!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting jobs:', error);
    process.exit(1);
  }
};

seedDB();