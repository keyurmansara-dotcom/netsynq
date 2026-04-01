import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Job from './models/Job.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const sampleJobs = [
  {
    title: "Senior Frontend Developer",
    company: "Google",
    location: "Remote",
    description: "We are looking for an experienced React developer to build modern web interfaces.",
    skillsRequired: ["React", "JavaScript", "Tailwind CSS"],
    type: "Remote"
  },
  {
    title: "Backend Node.js Engineer",
    company: "Amazon",
    location: "New York, NY",
    description: "Join our core infrastructure team to build scalable microservices.",
    skillsRequired: ["Node.js", "Express", "MongoDB"],
    type: "Full-time"
  },
  {
    title: "Full Stack Developer",
    company: "Microsoft",
    location: "Seattle, WA",
    description: "Work on end-to-end features spanning React frontend and Node.js backend.",
    skillsRequired: ["React", "Node.js", "TypeScript"],
    type: "Full-time"
  },
  {
    title: "UI/UX Designer",
    company: "Apple",
    location: "San Francisco, CA",
    description: "Design intuitive and beautiful user experiences for our next-gen products.",
    skillsRequired: ["Figma", "Prototyping", "CSS"],
    type: "Contract"
  },
  {
    title: "DevOps Engineer",
    company: "Netflix",
    location: "Remote",
    description: "Automate CI/CD pipelines and manage cloud infrastructure on AWS.",
    skillsRequired: ["Docker", "Kubernetes", "AWS"],
    type: "Remote"
  },
  {
    title: "Data Scientist",
    company: "Meta",
    location: "Los Angeles, CA",
    description: "Analyze large datasets to derive actionable business insights.",
    skillsRequired: ["Python", "SQL", "Machine Learning"],
    type: "Full-time"
  },
  {
    title: "Junior React Developer",
    company: "Spotify",
    location: "Austin, TX",
    description: "Great opportunity for a junior developer to learn and grow in a fast-paced environment.",
    skillsRequired: ["React", "HTML", "CSS"],
    type: "Full-time"
  },
  {
    title: "Mobile App Developer",
    company: "Uber",
    location: "Remote",
    description: "Build cross-platform mobile applications using React Native.",
    skillsRequired: ["React Native", "iOS", "Android"],
    type: "Remote"
  },
  {
    title: "Cybersecurity Analyst",
    company: "Tesla",
    location: "Chicago, IL",
    description: "Ensure the security of our internal networks and customer data.",
    skillsRequired: ["Network Security", "Penetration Testing"],
    type: "Full-time"
  },
  {
    title: "Product Manager",
    company: "Airbnb",
    location: "Denver, CO",
    description: "Lead cross-functional teams to deliver high-impact product features.",
    skillsRequired: ["Agile", "Scrum", "Product Strategy"],
    type: "Full-time"
  },
  {
    title: "Cloud Architect",
    company: "Oracle",
    location: "Remote",
    description: "Design and implement robust cloud solutions for enterprise clients.",
    skillsRequired: ["Azure", "AWS", "Terraform"],
    type: "Remote"
  },
  {
    title: "Part-time Web Developer",
    company: "Local Startup",
    location: "Boston, MA",
    description: "Help us build our landing page and early prototype part-time.",
    skillsRequired: ["HTML", "CSS", "JavaScript"],
    type: "Part-time"
  },
  {
    title: "AI/ML Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    description: "Push the boundaries of artificial intelligence and deep learning models.",
    skillsRequired: ["Python", "PyTorch", "TensorFlow"],
    type: "Full-time"
  }
];

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

    // Attach the recruiter ID to all sample jobs
    const jobsToInsert = sampleJobs.map(job => ({ ...job, recruiter: user._id }));

    // Optional: Clear existing jobs before inserting to avoid duplicates running this multiple times
    // await Job.deleteMany({}); 

    await Job.insertMany(jobsToInsert);
    console.log('✅ 13 Sample Jobs inserted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting jobs:', error);
    process.exit(1);
  }
};

seedDB();