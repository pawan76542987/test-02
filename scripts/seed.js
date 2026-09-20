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
  console.log('[Seed] Connected to MongoDB.');
};

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('[Seed] Purging existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Lab.deleteMany({}),
      Asset.deleteMany({}),
      IssueRequest.deleteMany({}),
      MaintenanceLog.deleteMany({})
    ]);

    // ==========================================
    // 1. Create Users
    // ==========================================
    console.log('[Seed] Creating institutional users...');

    // Admin
    const admin = new User({
      name: 'Prof. Rajeshwar Sharma',
      email: 'admin@labtrack.edu',
      password: 'Admin@12345',
      role: 'admin',
      userType: 'admin',
      department: 'Central Laboratory Directorate',
      idNumber: 'ADM-001',
      phone: '+91 9811001122',
      isActive: true
    });
    await admin.save();

    // Lab In-Charge 1 (CS & IoT)
    const inchargeCS = new User({
      name: 'Dr. Amitabh Sengupta',
      email: 'incharge.cs@labtrack.edu',
      password: 'Lab@12345',
      role: 'lab_incharge',
      userType: 'faculty',
      department: 'Computer Science & Engineering',
      idNumber: 'FAC-CS-104',
      phone: '+91 9822002233',
      isActive: true
    });
    await inchargeCS.save();

    // Lab In-Charge 2 (ECE & Robotics)
    const inchargeECE = new User({
      name: 'Dr. Meenakshi Sundaram',
      email: 'incharge.ece@labtrack.edu',
      password: 'Lab@12345',
      role: 'lab_incharge',
      userType: 'faculty',
      department: 'Electronics & Communication Eng.',
      idNumber: 'FAC-ECE-208',
      phone: '+91 9833003344',
      isActive: true
    });
    await inchargeECE.save();

    // Requester 1 (Student - CSE)
    const student1 = new User({
      name: 'Rahul Sharma',
      email: 'student.rahul@labtrack.edu',
      password: 'User@12345',
      role: 'student',
      userType: 'student',
      department: 'Computer Science & Engineering',
      idNumber: '2023CSB042',
      phone: '+91 9844004455',
      isActive: true
    });
    await student1.save();

    // Requester 2 (Student - ECE)
    const student2 = new User({
      name: 'Ananya Iyer',
      email: 'student.ananya@labtrack.edu',
      password: 'User@12345',
      role: 'student',
      userType: 'student',
      department: 'Electronics & Communication Eng.',
      idNumber: '2023ECB089',
      phone: '+91 9855005566',
      isActive: true
    });
    await student2.save();

    // Requester 3 (Staff / Researcher)
    const staff1 = new User({
      name: 'Dr. Priya Nair',
      email: 'staff.priya@labtrack.edu',
      password: 'User@12345',
      role: 'staff',
      userType: 'staff',
      department: 'Robotics & AI Center of Excellence',
      idNumber: 'RES-AI-019',
      phone: '+91 9866006677',
      isActive: true
    });
    await staff1.save();

    // ==========================================
    // 2. Create Categories
    // ==========================================
    console.log('[Seed] Creating asset categories...');

    const categories = await Category.insertMany([
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
    ]);

    const [catCmp, catTest, catMcu, catPwr, catOpt, catProto] = categories;

    // ==========================================
    // 3. Create Laboratories
    // ==========================================
    console.log('[Seed] Creating laboratory locations...');

    const labs = await Lab.insertMany([
      {
        name: 'IoT & Embedded Systems Laboratory',
        code: 'LAB-IOT',
        building: 'Tech Block A',
        floor: '3rd Floor',
        roomNumber: '302',
        description: 'Equipped for wireless sensor networks, edge AI microcontrollers, and IoT protocols.',
        incharge: inchargeCS._id,
        isActive: true
      },
      {
        name: 'Robotics & AI Research Laboratory',
        code: 'LAB-ROBO',
        building: 'Tech Block B',
        floor: '1st Floor',
        roomNumber: '104',
        description: 'Autonomous systems, robotic arms, vision computing, and SLAM navigation.',
        incharge: inchargeECE._id,
        isActive: true
      },
      {
        name: 'Power Electronics & Drives Laboratory',
        code: 'LAB-PWR',
        building: 'Electrical Engineering Block',
        floor: '2nd Floor',
        roomNumber: '201',
        description: 'High voltage converters, motor drives, solar inverters, and power analyzers.',
        incharge: inchargeECE._id,
        isActive: true
      },
      {
        name: 'Advanced High-Performance Computing Laboratory',
        code: 'LAB-COMP',
        building: 'IT Block',
        floor: '4th Floor',
        roomNumber: '405',
        description: 'Deep learning workstations, parallel CUDA computing, and simulation servers.',
        incharge: inchargeCS._id,
        isActive: true
      },
      {
        name: 'Physics & Instrumentation Laboratory',
        code: 'LAB-PHYS',
        building: 'Science Block',
        floor: 'Ground Floor',
        roomNumber: '108',
        description: 'General physics testing, optical benches, and calibration benchmarks.',
        incharge: inchargeECE._id,
        isActive: true
      }
    ]);

    const [labIot, labRobo, labPwr, labComp, labPhys] = labs;

    // Update incharge assignedLabs
    await User.findByIdAndUpdate(inchargeCS._id, {
      assignedLabs: [labIot._id, labComp._id]
    });
    await User.findByIdAndUpdate(inchargeECE._id, {
      assignedLabs: [labRobo._id, labPwr._id, labPhys._id]
    });

    // ==========================================
    // 4. Create Assets / Equipment
    // ==========================================
    console.log('[Seed] Creating 16+ realistic laboratory assets...');

    const assetData = [
      {
        assetTag: 'LAB-IOT-001',
        name: 'Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope',
        category: catTest._id,
        lab: labIot._id,
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
        category: catMcu._id,
        lab: labIot._id,
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
        category: catCmp._id,
        lab: labRobo._id,
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
        category: catCmp._id,
        lab: labComp._id,
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
        category: catTest._id,
        lab: labPwr._id,
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
        category: catMcu._id,
        lab: labIot._id,
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
      },
      {
        assetTag: 'LAB-PWR-002',
        name: 'Siglent SDG1032X 30MHz Dual-Channel Function Generator',
        category: catPwr._id,
        lab: labPwr._id,
        description: 'Dual-channel Arbitrary Waveform Generator with 150 MSa/s sampling rate and 14-bit vertical resolution.',
        specifications: 'Bandwidth: 30 MHz\nChannels: 2\nSampling Rate: 150 MSa/s\nWaveforms: Sine, Square, Ramp, Pulse, Noise, Arb',
        manufacturer: 'Siglent Technologies',
        modelNumber: 'SDG1032X',
        serialNumber: 'SIG-SDG-4401',
        totalQuantity: 8,
        availableQuantity: 6,
        issuedQuantity: 2,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 32000,
        purchaseDate: new Date('2023-12-05')
      },
      {
        assetTag: 'LAB-IOT-004',
        name: 'Weller WT1010 90W Precision Soldering & Rework Station',
        category: catProto._id,
        lab: labIot._id,
        description: 'Digital 90W single channel power unit with WTP 90 soldering iron and safety rest.',
        specifications: 'Power: 90 W\nTemperature Range: 50°C - 450°C\nTemperature Accuracy: ±9°C',
        manufacturer: 'Weller Tools',
        modelNumber: 'WT1010',
        serialNumber: 'WEL-WT-7801',
        totalQuantity: 6,
        availableQuantity: 4,
        issuedQuantity: 1,
        damagedQuantity: 0,
        maintenanceQuantity: 1,
        lostQuantity: 0,
        condition: 'good',
        cost: 28000,
        purchaseDate: new Date('2024-01-15')
      },
      {
        assetTag: 'LAB-ROBO-002',
        name: 'FLIR E8-XT Infrared Thermal Imaging Camera with MSX',
        category: catOpt._id,
        lab: labRobo._id,
        description: 'Handheld thermal camera with 320x240 IR resolution and MSX image enhancement for electronic thermal profiling.',
        specifications: 'IR Resolution: 320 x 240 pixels (76,800 pixels)\nThermal Sensitivity: < 0.05°C\nTemperature Range: -20°C to 550°C',
        manufacturer: 'FLIR Systems',
        modelNumber: 'FLIR-E8-XT',
        serialNumber: 'FLIR-IR-99120',
        totalQuantity: 3,
        availableQuantity: 1,
        issuedQuantity: 2,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 295000,
        purchaseDate: new Date('2023-09-22')
      },
      {
        assetTag: 'LAB-ROBO-003',
        name: 'Meta Quest 3 512GB VR Spatial Development Headset',
        category: catOpt._id,
        lab: labRobo._id,
        description: 'Next-gen mixed reality headset with 4K+ Infinite Display and full-color passthrough for robotics simulation.',
        specifications: 'Storage: 512GB\nDisplay: 2064x2208 pixels per eye\nChipset: Snapdragon XR2 Gen 2\nTracking: 6DoF inside-out',
        manufacturer: 'Meta Platforms',
        modelNumber: 'QUEST-3-512',
        serialNumber: 'MQ3-512-8823',
        totalQuantity: 5,
        availableQuantity: 3,
        issuedQuantity: 2,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 62000,
        purchaseDate: new Date('2024-04-02')
      },
      {
        assetTag: 'LAB-IOT-005',
        name: 'Texas Instruments MSP430FR5994 LaunchPad Evaluation Kit',
        category: catMcu._id,
        lab: labIot._id,
        description: 'Ultra-low-power MCU evaluation module with 256KB FRAM and Low Energy Accelerator (LEA).',
        specifications: 'MCU: MSP430FR5994 16-bit\nFRAM: 256 KB\nSRAM: 8 KB\nFeatures: On-board eZ-FET emulator',
        manufacturer: 'Texas Instruments',
        modelNumber: 'MSP-EXP430FR5994',
        serialNumber: 'TI-MSP-1029',
        totalQuantity: 18,
        availableQuantity: 15,
        issuedQuantity: 3,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 3400,
        purchaseDate: new Date('2024-03-01')
      },
      {
        assetTag: 'LAB-PWR-003',
        name: 'Keysight E36313A 160W Triple Output Programmable DC Power Supply',
        category: catPwr._id,
        lab: labPwr._id,
        description: 'Clean power delivery with low ripple, precise voltage/current programming and datalogging.',
        specifications: 'Outputs: 3 isolated channels (6V/10A, 25V/1A, 25V/1A)\nTotal Power: 160 W\nInterface: USB, LAN, GPIB',
        manufacturer: 'Keysight Technologies',
        modelNumber: 'E36313A',
        serialNumber: 'KEY-PWR-9981',
        totalQuantity: 4,
        availableQuantity: 3,
        issuedQuantity: 1,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 145000,
        purchaseDate: new Date('2023-10-18')
      },
      {
        assetTag: 'LAB-PHYS-001',
        name: 'Rohde & Schwarz HM8118 200kHz LCR Meter Benchtop Bridge',
        category: catTest._id,
        lab: labPhys._id,
        description: 'Precision LCR bridge measuring L, C, R, |Z|, X, |Y|, G, B, D, Q, Phase with 0.05% basic accuracy.',
        specifications: 'Test Frequency: 20 Hz to 200 kHz (69 steps)\nBasic Accuracy: 0.05%\nDisplay: Dual 5-digit LCD',
        manufacturer: 'Rohde & Schwarz',
        modelNumber: 'HM8118',
        serialNumber: 'RS-HM-2018',
        totalQuantity: 2,
        availableQuantity: 2,
        issuedQuantity: 0,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 210000,
        purchaseDate: new Date('2023-06-11')
      },
      {
        assetTag: 'LAB-PHYS-002',
        name: 'Thorlabs Benchtop HeNe Laser 632.8nm Red Light Source',
        category: catOpt._id,
        lab: labPhys._id,
        description: 'Stabilized Helium-Neon laser for optical interference, diffraction experiments, and holography.',
        specifications: 'Wavelength: 632.8 nm (Red)\nOutput Power: 5.0 mW TEM00\nBeam Diameter: 0.8 mm',
        manufacturer: 'Thorlabs Inc.',
        modelNumber: 'HNL050R',
        serialNumber: 'THOR-HNL-552',
        totalQuantity: 3,
        availableQuantity: 2,
        issuedQuantity: 1,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 95000,
        purchaseDate: new Date('2023-05-19')
      },
      {
        assetTag: 'LAB-PROTO-001',
        name: 'Hakko FX-888D Digital Soldering Station (ESD Safe)',
        category: catProto._id,
        lab: labIot._id,
        description: 'Compact 70W temperature-controlled soldering station for student electronics labs.',
        specifications: 'Power: 70 W\nTemp Range: 50°C - 480°C\nTemp Stability: ±1°C',
        manufacturer: 'Hakko Corporation',
        modelNumber: 'FX-888D',
        serialNumber: 'HAK-FX-1209',
        totalQuantity: 12,
        availableQuantity: 10,
        issuedQuantity: 2,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 11500,
        purchaseDate: new Date('2024-02-10')
      },
      {
        assetTag: 'LAB-ROBO-004',
        name: 'Intel RealSense D435i Depth Camera with IMU',
        category: catOpt._id,
        lab: labRobo._id,
        description: 'Stereo depth camera with integrated Inertial Measurement Unit (IMU) for SLAM and robotics navigation.',
        specifications: 'Depth Technology: Active IR Stereo\nRange: 0.3m - 3m\nRGB Resolution: 1920x1080 at 30fps\nDepth Resolution: 1280x720 at 90fps',
        manufacturer: 'Intel Corporation',
        modelNumber: 'D435i',
        serialNumber: 'INT-RS-88910',
        totalQuantity: 8,
        availableQuantity: 6,
        issuedQuantity: 2,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: 'good',
        cost: 28500,
        purchaseDate: new Date('2024-04-14')
      }
    ];

    const savedAssets = await Asset.insertMany(assetData);
    console.log(`[Seed] Successfully inserted ${savedAssets.length} assets.`);

    // Map for quick reference
    const assetMap = {};
    savedAssets.forEach(a => {
      assetMap[a.assetTag] = a;
    });

    // ==========================================
    // 5. Create Issue Requests across all states
    // ==========================================
    console.log('[Seed] Creating sample requests (Pending, Approved, Issued, Overdue, Returned, Rejected)...');

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const fiveDaysFuture = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const eightDaysFuture = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const requests = [
      // 1. PENDING Request
      {
        requestCode: 'REQ-2026-0001',
        requester: student1._id,
        asset: assetMap['LAB-IOT-002']._id, // Raspberry Pi 5
        lab: labIot._id,
        requestedQuantity: 1,
        purpose: 'Developing an Edge AI computer vision model for vehicle count in Smart Cities capstone project.',
        expectedReturnDate: fiveDaysFuture,
        requestDate: now,
        status: 'pending'
      },
      // 2. APPROVED Request (Awaiting Handover)
      {
        requestCode: 'REQ-2026-0002',
        requester: student2._id,
        asset: assetMap['LAB-PWR-001']._id, // Fluke Multimeter
        lab: labPwr._id,
        requestedQuantity: 1,
        purpose: 'Power factor and harmonic testing for 3-Phase induction motor laboratory assignment.',
        expectedReturnDate: eightDaysFuture,
        requestDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'approved',
        reviewedBy: inchargeECE._id,
        reviewedAt: now,
        approvalNotes: 'Approved. Please collect from Lab Bench 2 before 5 PM.'
      },
      // 3. ISSUED Request (Normal - Active borrowing)
      {
        requestCode: 'REQ-2026-0003',
        requester: staff1._id,
        asset: assetMap['LAB-ROBO-001']._id, // Jetson Orin
        lab: labRobo._id,
        requestedQuantity: 1,
        purpose: 'SLAM spatial localization research benchmarks on autonomous mobile robot chassis.',
        expectedReturnDate: fiveDaysFuture,
        requestDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'issued',
        reviewedBy: inchargeECE._id,
        reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        issuedBy: inchargeECE._id,
        issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        issueNotes: 'Issued with 19V power adapter and USB-C flashing cable.'
      },
      // 4. ISSUED & OVERDUE Request (Expected return 3 days ago!)
      {
        requestCode: 'REQ-2026-0004',
        requester: student1._id,
        asset: assetMap['LAB-IOT-001']._id, // Rigol Oscilloscope
        lab: labIot._id,
        requestedQuantity: 1,
        purpose: 'Signal integrity and PWM analysis for IoT microcontroller motor drive project.',
        expectedReturnDate: threeDaysAgo, // PAST DATE => DYNAMICALLY OVERDUE!
        requestDate: tenDaysAgo,
        status: 'issued',
        reviewedBy: inchargeCS._id,
        reviewedAt: tenDaysAgo,
        issuedBy: inchargeCS._id,
        issueDate: tenDaysAgo,
        issueNotes: 'Handed over with 2x 100MHz passive probes.'
      },
      // 5. RETURNED (OK Condition)
      {
        requestCode: 'REQ-2026-0005',
        requester: student2._id,
        asset: assetMap['LAB-IOT-003']._id, // Arduino Mega
        lab: labIot._id,
        requestedQuantity: 2,
        purpose: 'Sensor interfacing practical lab exam.',
        expectedReturnDate: threeDaysAgo,
        requestDate: fifteenDaysAgo,
        status: 'returned',
        reviewedBy: inchargeCS._id,
        reviewedAt: fifteenDaysAgo,
        issuedBy: inchargeCS._id,
        issueDate: fifteenDaysAgo,
        returnedQuantity: 2,
        actualReturnDate: threeDaysAgo,
        receivedBy: inchargeCS._id,
        returnCondition: 'ok',
        damagedUnits: 0,
        lostUnits: 0,
        returnNotes: 'All pins tested and verified in good working order.'
      },
      // 6. RETURNED (DAMAGED Condition)
      {
        requestCode: 'REQ-2026-0006',
        requester: student1._id,
        asset: assetMap['LAB-IOT-001']._id, // Rigol Oscilloscope
        lab: labIot._id,
        requestedQuantity: 1,
        purpose: 'Power ripple measurement in SMPS circuit.',
        expectedReturnDate: tenDaysAgo,
        requestDate: fifteenDaysAgo,
        status: 'returned',
        reviewedBy: inchargeCS._id,
        reviewedAt: fifteenDaysAgo,
        issuedBy: inchargeCS._id,
        issueDate: fifteenDaysAgo,
        returnedQuantity: 1,
        actualReturnDate: tenDaysAgo,
        receivedBy: inchargeCS._id,
        returnCondition: 'damaged',
        damagedUnits: 1,
        lostUnits: 0,
        returnNotes: 'Channel 1 BNC connector loose, needs internal soldering fix.'
      },
      // 7. REJECTED Request
      {
        requestCode: 'REQ-2026-0007',
        requester: student2._id,
        asset: assetMap['LAB-COMP-001']._id, // Dell Precision Workstation
        lab: labComp._id,
        requestedQuantity: 1,
        purpose: 'Personal video editing project.',
        expectedReturnDate: fiveDaysFuture,
        requestDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'rejected',
        reviewedBy: inchargeCS._id,
        reviewedAt: now,
        rejectionReason: 'Equipment reserved exclusively for institutional CUDA research projects.'
      }
    ];

    await IssueRequest.insertMany(requests);
    console.log(`[Seed] Inserted ${requests.length} sample issue requests across all lifecycle states.`);

    // ==========================================
    // 6. Create Maintenance Records
    // ==========================================
    console.log('[Seed] Creating equipment maintenance logs...');

    await MaintenanceLog.insertMany([
      {
        asset: assetMap['LAB-IOT-001']._id, // Rigol Oscilloscope
        serviceDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        description: 'BNC Input connector repair and 50MHz frequency response calibration.',
        cost: 3200,
        technicianVendor: 'Rigol Authorized Service Center, Bengaluru',
        nextServiceDue: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        status: 'completed',
        notes: 'Replaced Channel 1 BNC connector assembly. Calibration certificate issued.',
        createdBy: inchargeCS._id,
        completedDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        asset: assetMap['LAB-IOT-004']._id, // Weller Soldering Station
        serviceDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        description: 'Heating element burnout replacement and thermocouple recalibration.',
        cost: 1800,
        technicianVendor: 'Internal Central Instrumentation Workshop',
        status: 'in_progress',
        notes: 'Awaiting OEM replacement heating cartridge from supplier.',
        createdBy: inchargeCS._id
      }
    ]);

    console.log('[Seed] Database seeding completed successfully! ✨');
    console.log('====================================================');
    console.log('Default Seed Credentials:');
    console.log('👉 Admin:        admin@labtrack.edu          / Admin@12345');
    console.log('👉 Lab In-Charge incharge.cs@labtrack.edu    / Lab@12345');
    console.log('👉 Lab In-Charge incharge.ece@labtrack.edu   / Lab@12345');
    console.log('👉 Student:      student.rahul@labtrack.edu  / User@12345');
    console.log('👉 Staff:        staff.priya@labtrack.edu    / User@12345');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
