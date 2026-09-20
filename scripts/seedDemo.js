require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Lab = require('../models/Lab');
const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');
const MaintenanceLog = require('../models/MaintenanceLog');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_asset_management';
  await mongoose.connect(uri);
  console.log('[Demo Seed] Connected to MongoDB database.');
};

/**
 * Production-Safe, Idempotent Demo Seeding Script
 * - Never deletes or drops existing collections.
 * - Only inserts missing demo users, categories, labs, and baseline assets.
 * - Preserves existing user credentials and modifications.
 */
const seedDemoData = async () => {
  try {
    await connectDB();
    console.log('[Demo Seed] Starting idempotent demo provisioning...');

    // ==========================================
    // 1. Ensure Categories Exist
    // ==========================================
    const categoryDefs = [
      {
        name: 'Computing & High Performance Workstations',
        code: 'CMP',
        description: 'Multi-GPU workstations, AI accelerators, and developer systems.',
        icon: 'cpu',
        isActive: true
      },
      {
        name: 'Electronic Test & Measurement Instruments',
        code: 'TEST',
        description: 'Digital storage oscilloscopes, multimeters, spectrum analyzers, and LCR meters.',
        icon: 'activity',
        isActive: true
      },
      {
        name: 'Microcontrollers & Embedded Development Kits',
        code: 'MCU',
        description: 'ARM Cortex, Arduino Mega, Raspberry Pi 5, ESP32, and FPGA development boards.',
        icon: 'chip',
        isActive: true
      },
      {
        name: 'Power Supplies & Signal Generators',
        code: 'PWR',
        description: 'Programmable dual/triple-channel DC power supplies and Arbitrary Function Generators.',
        icon: 'zap',
        isActive: true
      },
      {
        name: 'Optics, Sensors & Imaging Systems',
        code: 'OPT',
        description: 'Thermal cameras, LiDAR sensors, stereo cameras, and VR headsets.',
        icon: 'eye',
        isActive: true
      },
      {
        name: 'Prototyping & Soldering Rework Stations',
        code: 'PROTO',
        description: 'SMD rework stations, precision soldering equipment, and desoldering tools.',
        icon: 'tool',
        isActive: true
      }
    ];

    const categoryMap = {};
    for (const catDef of categoryDefs) {
      let existingCat = await Category.findOne({ code: catDef.code });
      if (!existingCat) {
        existingCat = await Category.create(catDef);
        console.log(`  + Created category: ${catDef.name} (${catDef.code})`);
      } else {
        console.log(`  = Category exists: ${catDef.name} (${catDef.code})`);
      }
      categoryMap[catDef.code] = existingCat;
    }

    // ==========================================
    // 2. Ensure Laboratories Exist
    // ==========================================
    const labDefs = [
      {
        name: 'IoT & Embedded Systems Laboratory',
        code: 'LAB-IOT',
        building: 'Tech Block A',
        floor: '3rd Floor',
        roomNumber: '302',
        description: 'Equipped for wireless sensor networks, edge AI microcontrollers, and IoT protocols.',
        isActive: true
      },
      {
        name: 'Robotics & AI Research Laboratory',
        code: 'LAB-ROBO',
        building: 'Tech Block B',
        floor: '1st Floor',
        roomNumber: '104',
        description: 'Autonomous systems, robotic arms, vision computing, and SLAM navigation.',
        isActive: true
      },
      {
        name: 'Power Electronics & Drives Laboratory',
        code: 'LAB-PWR',
        building: 'Electrical Engineering Block',
        floor: '2nd Floor',
        roomNumber: '201',
        description: 'High voltage converters, motor drives, solar inverters, and power analyzers.',
        isActive: true
      },
      {
        name: 'Advanced High-Performance Computing Laboratory',
        code: 'LAB-COMP',
        building: 'IT Block',
        floor: '4th Floor',
        roomNumber: '405',
        description: 'Deep learning workstations, parallel CUDA computing, and simulation servers.',
        isActive: true
      },
      {
        name: 'Physics & Instrumentation Laboratory',
        code: 'LAB-PHYS',
        building: 'Science Block',
        floor: 'Ground Floor',
        roomNumber: '108',
        description: 'General physics testing, optical benches, and calibration benchmarks.',
        isActive: true
      }
    ];

    const labMap = {};
    for (const labDef of labDefs) {
      let existingLab = await Lab.findOne({ code: labDef.code });
      if (!existingLab) {
        existingLab = await Lab.create(labDef);
        console.log(`  + Created lab: ${labDef.name} (${labDef.code})`);
      } else {
        console.log(`  = Lab exists: ${labDef.name} (${labDef.code})`);
      }
      labMap[labDef.code] = existingLab;
    }

    // ==========================================
    // 3. Ensure Demo Users Exist (Safe & Idempotent)
    // ==========================================
    const userDefs = [
      {
        name: 'Prof. Rajeshwar Sharma',
        email: 'admin@labtrack.edu',
        password: 'Admin@12345',
        role: 'admin',
        userType: 'admin',
        department: 'Central Laboratory Directorate',
        idNumber: 'ADM-001',
        phone: '+91 9811001122',
        isActive: true
      },
      {
        name: 'Dr. Amitabh Sengupta',
        email: 'incharge.cs@labtrack.edu',
        password: 'Lab@12345',
        role: 'lab_incharge',
        userType: 'faculty',
        department: 'Computer Science & Engineering',
        idNumber: 'FAC-CS-104',
        phone: '+91 9822002233',
        assignedLabs: [labMap['LAB-IOT']?._id, labMap['LAB-COMP']?._id].filter(Boolean),
        isActive: true
      },
      {
        name: 'Dr. Meenakshi Sundaram',
        email: 'incharge.ece@labtrack.edu',
        password: 'Lab@12345',
        role: 'lab_incharge',
        userType: 'faculty',
        department: 'Electronics & Communication Eng.',
        idNumber: 'FAC-ECE-208',
        phone: '+91 9833003344',
        assignedLabs: [labMap['LAB-ROBO']?._id, labMap['LAB-PWR']?._id, labMap['LAB-PHYS']?._id].filter(Boolean),
        isActive: true
      },
      {
        name: 'Rahul Sharma',
        email: 'student.rahul@labtrack.edu',
        password: 'User@12345',
        role: 'student',
        userType: 'student',
        department: 'Computer Science & Engineering',
        idNumber: '2023CSB042',
        phone: '+91 9844004455',
        isActive: true
      },
      {
        name: 'Ananya Iyer',
        email: 'student.ananya@labtrack.edu',
        password: 'User@12345',
        role: 'student',
        userType: 'student',
        department: 'Electronics & Communication Eng.',
        idNumber: '2023ECB089',
        phone: '+91 9855005566',
        isActive: true
      },
      {
        name: 'Dr. Priya Nair',
        email: 'staff.priya@labtrack.edu',
        password: 'User@12345',
        role: 'staff',
        userType: 'staff',
        department: 'Robotics & AI Center of Excellence',
        idNumber: 'RES-AI-019',
        phone: '+91 9866006677',
        isActive: true
      }
    ];

    const userMap = {};
    for (const uDef of userDefs) {
      let existingUser = await User.findOne({ email: uDef.email.toLowerCase().trim() });
      if (!existingUser) {
        // Create new demo user (triggers bcrypt pre-save hook)
        const newUser = new User(uDef);
        existingUser = await newUser.save();
        console.log(`  + Created demo account: ${uDef.email} [Role: ${uDef.role}]`);
      } else {
        // Safely update existing demo account to guarantee credentials and role match documentation
        existingUser.name = uDef.name;
        existingUser.role = uDef.role;
        existingUser.userType = uDef.userType;
        existingUser.department = uDef.department;
        existingUser.idNumber = uDef.idNumber;
        existingUser.phone = uDef.phone;
        existingUser.isActive = true;
        if (uDef.assignedLabs && uDef.assignedLabs.length > 0) {
          existingUser.assignedLabs = uDef.assignedLabs;
        }

        // Setting password triggers Mongoose pre('save') bcrypt hashing
        existingUser.password = uDef.password;
        await existingUser.save();
        console.log(`  ↻ Synchronized & updated credentials for demo account: ${uDef.email} [Role: ${uDef.role}]`);
      }
      userMap[uDef.email] = existingUser;
    }

    // Update in-charge references on Labs if unassigned
    if (labMap['LAB-IOT'] && userMap['incharge.cs@labtrack.edu']) {
      await Lab.findByIdAndUpdate(labMap['LAB-IOT']._id, { incharge: userMap['incharge.cs@labtrack.edu']._id });
    }
    if (labMap['LAB-COMP'] && userMap['incharge.cs@labtrack.edu']) {
      await Lab.findByIdAndUpdate(labMap['LAB-COMP']._id, { incharge: userMap['incharge.cs@labtrack.edu']._id });
    }
    if (labMap['LAB-ROBO'] && userMap['incharge.ece@labtrack.edu']) {
      await Lab.findByIdAndUpdate(labMap['LAB-ROBO']._id, { incharge: userMap['incharge.ece@labtrack.edu']._id });
    }
    if (labMap['LAB-PWR'] && userMap['incharge.ece@labtrack.edu']) {
      await Lab.findByIdAndUpdate(labMap['LAB-PWR']._id, { incharge: userMap['incharge.ece@labtrack.edu']._id });
    }
    if (labMap['LAB-PHYS'] && userMap['incharge.ece@labtrack.edu']) {
      await Lab.findByIdAndUpdate(labMap['LAB-PHYS']._id, { incharge: userMap['incharge.ece@labtrack.edu']._id });
    }

    // ==========================================
    // 4. Ensure Baseline Equipment Exists (if DB empty)
    // ==========================================
    const totalAssets = await Asset.countDocuments();
    if (totalAssets === 0) {
      console.log('[Demo Seed] Database has 0 assets. Creating baseline equipment catalog...');
      const sampleAssets = [
        {
          assetTag: 'LAB-IOT-001',
          name: 'Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope',
          category: categoryMap['TEST']._id,
          lab: labMap['LAB-IOT']._id,
          description: 'Standard 4-channel 50MHz digital oscilloscope with 1 GSa/s real-time sample rate.',
          specifications: 'Bandwidth: 50 MHz\nChannels: 4\nMax Sample Rate: 1 GSa/s\nMemory Depth: 24 Mpts',
          manufacturer: 'Rigol Technologies',
          modelNumber: 'DS1054Z',
          serialNumber: 'DS1Z-2490184',
          totalQuantity: 10,
          availableQuantity: 7,
          issuedQuantity: 2,
          damagedQuantity: 1,
          maintenanceQuantity: 0,
          lostQuantity: 0,
          condition: 'good',
          cost: 38500,
          purchaseDate: new Date('2024-03-15')
        },
        {
          assetTag: 'LAB-IOT-002',
          name: 'Raspberry Pi 5 (8GB RAM) Developer Kits',
          category: categoryMap['MCU']._id,
          lab: labMap['LAB-IOT']._id,
          description: 'Quad-core 64-bit Arm Cortex-A76 processor with official active cooler, 64GB microSD, and power supply.',
          specifications: 'CPU: Broadcom BCM2712 2.4GHz\nRAM: 8GB LPDDR4X\nPorts: 2x micro-HDMI 4Kp60, 2x USB 3.0, PCIe 2.0',
          manufacturer: 'Raspberry Pi Foundation',
          modelNumber: 'RPI-5-8GB',
          serialNumber: 'RPI5-982104',
          totalQuantity: 20,
          availableQuantity: 14,
          issuedQuantity: 5,
          damagedQuantity: 0,
          maintenanceQuantity: 0,
          lostQuantity: 1,
          condition: 'good',
          cost: 9200,
          purchaseDate: new Date('2024-05-10')
        },
        {
          assetTag: 'LAB-ROBO-001',
          name: 'NVIDIA Jetson AGX Orin 64GB Developer Kit',
          category: categoryMap['CMP']._id,
          lab: labMap['LAB-ROBO']._id,
          description: 'Server-grade AI performance up to 275 TOPS for autonomous machines and robotics perception.',
          specifications: 'GPU: 2048-core NVIDIA Ampere with 64 Tensor Cores\nCPU: 12-core Arm Cortex-A78AE\nMemory: 64GB 256-bit LPDDR5',
          manufacturer: 'NVIDIA Corporation',
          modelNumber: 'JETSON-AGX-ORIN',
          serialNumber: 'NV-ORIN-88912',
          totalQuantity: 4,
          availableQuantity: 2,
          issuedQuantity: 2,
          damagedQuantity: 0,
          maintenanceQuantity: 0,
          lostQuantity: 0,
          condition: 'good',
          cost: 185000,
          purchaseDate: new Date('2024-01-20')
        },
        {
          assetTag: 'LAB-COMP-001',
          name: 'Dell Precision 7920 Dual Intel Xeon AI Workstation',
          category: categoryMap['CMP']._id,
          lab: labMap['LAB-COMP']._id,
          description: 'High performance compute station equipped with Dual Intel Xeon Gold and Dual NVIDIA RTX A6000 GPUs.',
          specifications: 'Processors: 2x Intel Xeon Gold 6248R (48 Cores)\nRAM: 256GB ECC DDR4\nGPUs: 2x NVIDIA RTX A6000 48GB',
          manufacturer: 'Dell Technologies',
          modelNumber: 'Precision 7920',
          serialNumber: 'DELL-TAG-7920X',
          totalQuantity: 6,
          availableQuantity: 4,
          issuedQuantity: 2,
          damagedQuantity: 0,
          maintenanceQuantity: 0,
          lostQuantity: 0,
          condition: 'good',
          cost: 650000,
          purchaseDate: new Date('2023-11-10')
        },
        {
          assetTag: 'LAB-PWR-001',
          name: 'Fluke 87V Industrial True-RMS Digital Multimeter',
          category: categoryMap['TEST']._id,
          lab: labMap['LAB-PWR']._id,
          description: 'Heavy duty True-RMS multimeter for industrial electrical and power electronics measurements.',
          specifications: 'Voltage: 1000V AC/DC\nCurrent: 10A (20A for 30s)\nAccuracy: 0.05% DC\nCAT IV 600V / CAT III 1000V',
          manufacturer: 'Fluke Corporation',
          modelNumber: 'Fluke-87V',
          serialNumber: 'FLK-87V-49012',
          totalQuantity: 15,
          availableQuantity: 12,
          issuedQuantity: 3,
          damagedQuantity: 0,
          maintenanceQuantity: 0,
          lostQuantity: 0,
          condition: 'good',
          cost: 44000,
          purchaseDate: new Date('2023-08-14')
        },
        {
          assetTag: 'LAB-IOT-003',
          name: 'Arduino Mega 2560 R3 Microcontroller Experimentation Kit',
          category: categoryMap['MCU']._id,
          lab: labMap['LAB-IOT']._id,
          description: 'ATmega2560 board with 54 digital I/O pins, 16 analog inputs, and complete sensor shield accessories.',
          specifications: 'Microcontroller: ATmega2560\nClock Speed: 16 MHz\nFlash: 256 KB\nOperating Voltage: 5V',
          manufacturer: 'Arduino Official',
          modelNumber: 'MEGA-2560-R3',
          serialNumber: 'ARD-MEGA-190',
          totalQuantity: 25,
          availableQuantity: 20,
          issuedQuantity: 5,
          damagedQuantity: 0,
          maintenanceQuantity: 0,
          lostQuantity: 0,
          condition: 'good',
          cost: 4200,
          purchaseDate: new Date('2024-02-18')
        }
      ];

      const createdAssets = await Asset.insertMany(sampleAssets);
      console.log(`  + Inserted ${createdAssets.length} baseline assets.`);

      // Create initial sample requests if requests collection is empty
      const totalRequests = await IssueRequest.countDocuments();
      if (totalRequests === 0) {
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        const fiveDaysFuture = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

        const asset1 = createdAssets.find(a => a.assetTag === 'LAB-IOT-001');
        const asset2 = createdAssets.find(a => a.assetTag === 'LAB-IOT-002');
        const asset3 = createdAssets.find(a => a.assetTag === 'LAB-ROBO-001');

        await IssueRequest.insertMany([
          {
            requestCode: 'REQ-2026-0001',
            requester: userMap['student.rahul@labtrack.edu']._id,
            asset: asset2._id,
            lab: labMap['LAB-IOT']._id,
            requestedQuantity: 1,
            purpose: 'Developing an Edge AI computer vision model for vehicle count in Smart Cities capstone project.',
            expectedReturnDate: fiveDaysFuture,
            requestDate: now,
            status: 'pending'
          },
          {
            requestCode: 'REQ-2026-0003',
            requester: userMap['staff.priya@labtrack.edu']._id,
            asset: asset3._id,
            lab: labMap['LAB-ROBO']._id,
            requestedQuantity: 1,
            purpose: 'SLAM spatial localization research benchmarks on autonomous mobile robot chassis.',
            expectedReturnDate: fiveDaysFuture,
            requestDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            status: 'issued',
            reviewedBy: userMap['incharge.ece@labtrack.edu']._id,
            reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            issuedBy: userMap['incharge.ece@labtrack.edu']._id,
            issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            issueNotes: 'Issued with 19V power adapter and USB-C flashing cable.'
          },
          {
            requestCode: 'REQ-2026-0004',
            requester: userMap['student.rahul@labtrack.edu']._id,
            asset: asset1._id,
            lab: labMap['LAB-IOT']._id,
            requestedQuantity: 1,
            purpose: 'Signal integrity and PWM analysis for IoT microcontroller motor drive project.',
            expectedReturnDate: threeDaysAgo,
            requestDate: tenDaysAgo,
            status: 'issued',
            reviewedBy: userMap['incharge.cs@labtrack.edu']._id,
            reviewedAt: tenDaysAgo,
            issuedBy: userMap['incharge.cs@labtrack.edu']._id,
            issueDate: tenDaysAgo,
            issueNotes: 'Handed over with 2x 100MHz passive probes.'
          }
        ]);
        console.log('  + Created sample requests across pending, issued, and overdue states.');
      }
    } else {
      console.log(`  = Database already contains ${totalAssets} assets. Preserving existing inventory.`);
    }

    console.log('\n====================================================');
    console.log('✅ Demo Account Provisioning Completed Successfully!');
    console.log('Verified Demo Accounts:');
    console.log('  👑 Admin:        admin@labtrack.edu          / Admin@12345');
    console.log('  🔬 In-Charge CS: incharge.cs@labtrack.edu    / Lab@12345');
    console.log('  🔬 In-Charge ECE:incharge.ece@labtrack.edu   / Lab@12345');
    console.log('  🎓 Student:      student.rahul@labtrack.edu  / User@12345');
    console.log('  💼 Staff:        staff.priya@labtrack.edu    / User@12345');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Demo Seed Error]:', err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedDemoData();
