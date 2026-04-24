/**
 * Seed script - creates test users and slots for development
 * Run with: node backend/src/scripts/seed.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')
const Slot = require('../models/Slot')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing
  await User.deleteMany({})
  await Slot.deleteMany({})
  console.log('Cleared existing data')

  // Create users
  const doctor1 = await User.create({ name: 'Dr. Priya Sharma', email: 'priya@doctor.com', password: 'password123', role: 'doctor', specialty: 'General Medicine' })
  const doctor2 = await User.create({ name: 'Dr. Arjun Mehta',  email: 'arjun@doctor.com', password: 'password123', role: 'doctor', specialty: 'Pediatrics' })
  await User.create({ name: 'Ravi Kumar',  email: 'ravi@patient.com', password: 'password123', role: 'patient' })
  await User.create({ name: 'Sunita Devi', email: 'sunita@asha.com',  password: 'password123', role: 'asha' })
  await User.create({ name: 'Admin User',  email: 'admin@hospital.com', password: 'password123', role: 'admin' })
  console.log('Created 5 users')

  // Create slots for today and tomorrow
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  await Slot.insertMany([
    { doctorId: doctor1._id, date: today,    startTime: '10:00', endTime: '10:30', time: '10:00 AM', isBooked: false },
    { doctorId: doctor1._id, date: today,    startTime: '11:00', endTime: '11:30', time: '11:00 AM', isBooked: false },
    { doctorId: doctor1._id, date: today,    startTime: '14:00', endTime: '14:30', time: '02:00 PM', isBooked: false },
    { doctorId: doctor2._id, date: today,    startTime: '10:30', endTime: '11:00', time: '10:30 AM', isBooked: false },
    { doctorId: doctor2._id, date: today,    startTime: '12:00', endTime: '12:30', time: '12:00 PM', isBooked: false },
    { doctorId: doctor1._id, date: tomorrow, startTime: '09:00', endTime: '09:30', time: '09:00 AM', isBooked: false },
    { doctorId: doctor2._id, date: tomorrow, startTime: '03:00', endTime: '03:30', time: '03:00 PM', isBooked: false },
  ])
  console.log('Created 7 slots')

  console.log('\n✅ Seed complete! Test accounts:')
  console.log('  Patient:  ravi@patient.com   / password123')
  console.log('  Doctor:   priya@doctor.com   / password123')
  console.log('  Doctor:   arjun@doctor.com   / password123')
  console.log('  ASHA:     sunita@asha.com    / password123')
  console.log('  Admin:    admin@hospital.com / password123')

  mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
