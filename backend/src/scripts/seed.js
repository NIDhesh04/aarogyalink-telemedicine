/**
 * Seed script - creates test users and slots for development
 * Run with: node backend/src/scripts/seed.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')
const Doctor = require('../models/Doctor')
const Slot = require('../models/Slot')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing
  await User.deleteMany({})
  await Doctor.deleteMany({})
  await Slot.deleteMany({})
  console.log('Cleared existing data')

  // Create users
  const doctor1User = await User.create({ name: 'Dr. Priya Sharma', email: 'priya@doctor.com', password: 'password123', role: 'doctor' })
  const doctor2User = await User.create({ name: 'Dr. Arjun Mehta',  email: 'arjun@doctor.com', password: 'password123', role: 'doctor' })

  // Patients — visible in the ASHA dashboard caseload
  await User.create({ name: 'Ravi Kumar',     email: 'ravi@patient.com',    password: 'password123', role: 'patient' })
  await User.create({ name: 'Meena Devi',     email: 'meena@patient.com',   password: 'password123', role: 'patient' })
  await User.create({ name: 'Gopal Sharma',   email: 'gopal@patient.com',   password: 'password123', role: 'patient' })
  await User.create({ name: 'Sunita Bai',     email: 'sunitab@patient.com', password: 'password123', role: 'patient' })
  await User.create({ name: 'Ramesh Yadav',   email: 'ramesh@patient.com',  password: 'password123', role: 'patient' })
  await User.create({ name: 'Kavita Singh',   email: 'kavita@patient.com',  password: 'password123', role: 'patient' })

  // ASHA worker + Admin
  await User.create({ name: 'Sunita Devi',  email: 'sunita@asha.com',     password: 'password123', role: 'asha' })
  await User.create({ name: 'Admin User',   email: 'admin@hospital.com',  password: 'password123', role: 'admin' })
  console.log('Created 10 users (2 doctors, 6 patients, 1 ASHA, 1 admin)')

  // Create doctor profiles (normalized schema)
  await Doctor.create({ userId: doctor1User._id, specialty: 'General Medicine', availableDays: ['Monday', 'Wednesday', 'Friday'] })
  await Doctor.create({ userId: doctor2User._id, specialty: 'Pediatrics', availableDays: ['Tuesday', 'Thursday', 'Saturday'] })
  console.log('Created 2 doctor profiles')

  // Create slots for today and tomorrow
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  // Create slots for the next 7 days
  const slotsToCreate = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() + i * 86400000).toISOString().split('T')[0]
    slotsToCreate.push(
      { doctorId: doctor1User._id, date, startTime: '10:00', endTime: '10:30', time: '10:00 AM', isBooked: false },
      { doctorId: doctor1User._id, date, startTime: '11:00', endTime: '11:30', time: '11:00 AM', isBooked: false },
      { doctorId: doctor1User._id, date, startTime: '14:00', endTime: '14:30', time: '02:00 PM', isBooked: false },
      { doctorId: doctor2User._id, date, startTime: '09:00', endTime: '09:30', time: '09:00 AM', isBooked: false },
      { doctorId: doctor2User._id, date, startTime: '10:30', endTime: '11:00', time: '10:30 AM', isBooked: false },
      { doctorId: doctor2User._id, date, startTime: '15:00', endTime: '15:30', time: '03:00 PM', isBooked: false },
    )
  }
  await Slot.insertMany(slotsToCreate)
  console.log(`Created ${slotsToCreate.length} slots (6 per day × 7 days)`)

  console.log('\n✅ Seed complete! Test accounts:')
  console.log('  Patients: ravi@patient.com, meena@patient.com, gopal@patient.com')
  console.log('            sunitab@patient.com, ramesh@patient.com, kavita@patient.com')
  console.log('            (all password: password123)')
  console.log('  Doctor:   priya@doctor.com   / password123  → General Medicine')
  console.log('  Doctor:   arjun@doctor.com   / password123  → Pediatrics')
  console.log('  ASHA:     sunita@asha.com    / password123')
  console.log('  Admin:    admin@hospital.com / password123')

  mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
