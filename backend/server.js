const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const connectDB = require('./db');

// Models
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const DriverLocation = require('./models/DriverLocation');
const Bus = require('./models/Bus');
const DamageReport = require('./models/DamageReport');
const AttendanceOTP = require('./models/AttendanceOTP');
const LeaveRequest = require('./models/LeaveRequest');
const Announcement = require('./models/Announcement');
const WeatherUpdate = require('./models/WeatherUpdate');
const Feedback = require('./models/Feedback');
const FeeReminder = require('./models/FeeReminder');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'akshuu_secret_key_fallback_2026';
const ANALYTICS_FILE = path.join(__dirname, 'analytics.json');
const WEATHER_LATITUDE = Number(process.env.WEATHER_LATITUDE || 11.4968);
const WEATHER_LONGITUDE = Number(process.env.WEATHER_LONGITUDE || 77.2722);
const WEATHER_LOCATION_NAME = process.env.WEATHER_LOCATION_NAME || 'BIT Sathy Campus';
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LATITUDE}&longitude=${WEATHER_LONGITUDE}&current=temperature_2m,weather_code,is_day,precipitation,wind_speed_10m&timezone=auto`;

// Connect to MongoDB
connectDB();

app.use(cors());
// Allow base64 image payloads for damage reports (default 100kb is too small).
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const loadAnalyticsStore = () => {
    try {
        if (fs.existsSync(ANALYTICS_FILE)) {
            const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error("Failed to read analytics store:", err.message);
    }
    return { monthlyAttendance: [] };
};

const saveAnalyticsStore = (data) => {
    try {
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Failed to save analytics store:", err.message);
    }
};

const buildDefaultMonthlyAttendance = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const month = d.toLocaleString('en-US', { month: 'short' });
        months.push({ month, monthKey, present: 0, absent: 0 });
    }
    return months;
};

const mergeMonthlyAttendance = (computed, stored) => {
    const defaults = buildDefaultMonthlyAttendance();
    const computedMap = new Map((computed || []).map((m) => [m.monthKey, m]));
    const storedMap = new Map((stored || []).map((m) => [m.monthKey, m]));
    return defaults.map((d) => computedMap.get(d.monthKey) || storedMap.get(d.monthKey) || d);
};

const toNumberOrDefault = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toDateOrUndefined = (value) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const buildUserPayload = (body = {}) => {
    const role = String(body.role || 'student').toLowerCase();
    const payload = {
        name: body.name,
        email: body.email,
        role,
        phone: body.phone || '',
        department: body.department || '',
        assignedBus: body.assignedBus || '',
        totalFees: toNumberOrDefault(body.totalFees, 0),
        paidFees: toNumberOrDefault(body.paidFees, 0),
        paymentStatus: String(body.paymentStatus || '').trim() || 'Pending'
    };

    if (role === 'student') {
        payload.studentId = body.studentId || '';
        payload.year = body.year || '';
        payload.parentContact = body.parentContact || '';
        payload.bloodGroup = body.bloodGroup || '';
        payload.address = body.address || '';
    }

    if (role === 'teacher') {
        payload.employeeId = body.employeeId || '';
        payload.designation = body.designation || '';
        payload.cabinNo = body.cabinNo || '';
    }

    if (role === 'driver') {
        const normalizedLicense = body.licenseNumber || body.licenseNo || '';
        payload.licenseNumber = normalizedLicense;
        payload.licenseNo = normalizedLicense;
        payload.experience = body.experience || '';
        payload.bloodGroup = body.bloodGroup || '';
        payload.joiningDate = toDateOrUndefined(body.joiningDate);
        payload.emergencyContact = body.emergencyContact || '';
        payload.address = body.address || '';
        payload.assignedBusNo = body.assignedBusNo || '';
    }

    const due = Math.max(0, Number(payload.totalFees || 0) - Number(payload.paidFees || 0));
    payload.paymentStatus = due <= 0 && Number(payload.totalFees || 0) > 0 ? 'Paid' : 'Pending';

    return payload;
};

const buildBusPayload = (body = {}) => ({
    busNo: body.busNo,
    route: body.route || '',
    type: body.type || 'Transport',
    status: body.status || 'Running',
    driverId: body.driverId || undefined,
    capacity: toNumberOrDefault(body.capacity, 40),
    filledSeats: toNumberOrDefault(body.filledSeats, 0),
    feesPerTerm: toNumberOrDefault(body.feesPerTerm, 0),
    insuranceNo: body.insuranceNo || '',
    insuranceExpiry: toDateOrUndefined(body.insuranceExpiry),
    condition: body.condition || 'Good',
    maintenanceStatus: body.maintenanceStatus || 'Up to date'
});

const mapWeatherCodeToCondition = (code) => {
    if (code === 0) return 'Sunny';
    if (code === 1 || code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Cloudy';
    if (code === 45 || code === 48) return 'Foggy';
    if ([51, 53, 55, 56, 57, 61, 63, 80, 81].includes(code)) return 'Light Rain';
    if ([65, 66, 67, 82].includes(code)) return 'Heavy Rain';
    if ([95, 96, 99].includes(code)) return 'Storm';
    return 'Cloudy';
};

const buildWeatherNote = ({ condition, precipitation, windSpeed }) => {
    const notes = [];

    if (condition === 'Heavy Rain' || condition === 'Storm') {
        notes.push('Road visibility may be affected.');
    } else if (condition === 'Light Rain') {
        notes.push('Minor rain expected on routes.');
    } else if (condition === 'Foggy') {
        notes.push('Drive carefully in low visibility conditions.');
    } else if (condition === 'Sunny') {
        notes.push('Routes are currently clear.');
    }

    if (Number(precipitation) > 0) {
        notes.push(`Precipitation ${Number(precipitation).toFixed(1)} mm.`);
    }

    if (Number(windSpeed) >= 25) {
        notes.push(`Wind speed ${Math.round(Number(windSpeed))} km/h.`);
    }

    return notes.join(' ');
};

const getRealWeatherSnapshot = async () => {
    const response = await fetch(WEATHER_API_URL);
    if (!response.ok) {
        throw new Error(`Weather API failed with status ${response.status}`);
    }

    const data = await response.json();
    const current = data?.current || {};
    const weatherCode = Number(current.weather_code);
    const condition = mapWeatherCodeToCondition(weatherCode);

    return {
        condition,
        temperatureC: Number(current.temperature_2m) || 0,
        precipitationMm: Number(current.precipitation) || 0,
        windSpeedKmh: Number(current.wind_speed_10m) || 0,
        isDay: Number(current.is_day) === 1,
        weatherCode,
        note: buildWeatherNote({
            condition,
            precipitation: current.precipitation,
            windSpeed: current.wind_speed_10m
        }),
        updatedAt: current.time ? new Date(current.time) : new Date(),
        source: 'Open-Meteo',
        locationName: WEATHER_LOCATION_NAME
    };
};

// Middleware to verify Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("Token verification failed:", err.message);
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.userId = decoded.id;
        req.userRole = String(decoded.role || "").toLowerCase();
        next();
    });
};

// Health Check
app.get('/', (req, res) => {
    res.json({ status: "Backend is running", time: new Date() });
});

// ================= AUTHENTICATION =================
app.post('/api/auth/login', async (req, res) => {
    const rawEmail = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');

    if (!rawEmail || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const email = rawEmail.toLowerCase();
        const user =
            await User.findOne({ email }) ||
            await User.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.password || typeof user.password !== 'string') {
            return res.status(500).json({ error: "This account has an invalid password record. Reset or recreate the account." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, password, role } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: "Email already exists. Please use a different email." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            ...buildUserPayload({ ...req.body, name, email, role: role || 'student' }),
            password: hashedPassword
        });
        await newUser.save();
        res.json({ id: newUser._id, message: "User created", user: { ...newUser.toObject(), password: undefined } });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ error: "Email already exists. Please use a different email." });
        }
        res.status(400).json({ error: err.message });
    }
});

// ================= USERS & ADMIN =================
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find({}, 'name email role');
        // Transform _id to id for frontend compatibility
        const formattedUsers = users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }));
        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const {
            name,
            phone,
            department,
            year,
            studentId,
            isTwoFactorEnabled,
            licenseNo,
            licenseCardImage,
            assignedBusNo
        } = req.body;

        const update = {};
        if (name !== undefined) update.name = name;
        if (phone !== undefined) update.phone = phone;
        if (department !== undefined) update.department = department;
        if (year !== undefined) update.year = year;
        if (studentId !== undefined) update.studentId = studentId;
        if (isTwoFactorEnabled !== undefined) update.isTwoFactorEnabled = isTwoFactorEnabled;
        if (licenseNo !== undefined) update.licenseNo = licenseNo;
        if (licenseCardImage !== undefined) update.licenseCardImage = licenseCardImage;
        if (assignedBusNo !== undefined) update.assignedBusNo = assignedBusNo;

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            update,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ error: "User not found" });

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ATTENDANCE =================
app.post('/api/attendance/mark', verifyToken, async (req, res) => {
    const { studentId, status } = req.body;
    try {
        const newAttendance = new Attendance({ student_id: studentId, status });
        await newAttendance.save();
        res.json({ message: "Attendance marked", id: newAttendance._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/:studentId', verifyToken, async (req, res) => {
    const { studentId } = req.params;
    try {
        const records = await Attendance.find({ student_id: studentId }).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance', verifyToken, async (req, res) => {
    if (req.userRole === 'student') return res.status(403).json({ error: "Access denied" });
    try {
        // Populate student info
        const records = await Attendance.find().populate('student_id', 'name email').sort({ date: -1 });

        // Flatten for frontend consistency
        const flattened = records.map(r => ({
            _id: r._id,
            date: r.date,
            status: r.status,
            student_id: r.student_id?._id,
            student_name: r.student_id?.name,
            student_email: r.student_id?.email
        }));

        res.json(flattened);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a general user
app.put('/api/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const updateBody = { ...req.body };
        if (updateBody.password) {
            updateBody.password = await bcrypt.hash(updateBody.password, 10);
        }
        if (updateBody.licenseNumber && !updateBody.licenseNo) {
            updateBody.licenseNo = updateBody.licenseNumber;
        }
        if (updateBody.licenseNo && !updateBody.licenseNumber) {
            updateBody.licenseNumber = updateBody.licenseNo;
        }
        if (updateBody.totalFees !== undefined || updateBody.paidFees !== undefined) {
            const totalFees = updateBody.totalFees !== undefined ? toNumberOrDefault(updateBody.totalFees, 0) : undefined;
            const paidFees = updateBody.paidFees !== undefined ? toNumberOrDefault(updateBody.paidFees, 0) : undefined;
            if (totalFees !== undefined) updateBody.totalFees = totalFees;
            if (paidFees !== undefined) updateBody.paidFees = paidFees;

            const existingUser = await User.findById(req.params.id).select('totalFees paidFees');
            const finalTotalFees = totalFees !== undefined ? totalFees : toNumberOrDefault(existingUser?.totalFees, 0);
            const finalPaidFees = paidFees !== undefined ? paidFees : toNumberOrDefault(existingUser?.paidFees, 0);
            updateBody.paymentStatus =
                finalTotalFees > 0 && finalPaidFees >= finalTotalFees ? 'Paid' : 'Pending';
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateBody, { new: true });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a general user
app.delete('/api/users/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= BUS MANAGEMENT =================
app.get('/api/buses', verifyToken, async (req, res) => {
    try {
        const buses = await Bus.find();
        res.json(buses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/buses', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const newBus = new Bus(buildBusPayload(req.body));
        await newBus.save();
        res.json(newBus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/buses/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await Bus.findByIdAndDelete(req.params.id);
        res.json({ message: "Bus deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a bus
app.put('/api/buses/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const existingBus = await Bus.findById(req.params.id);
        if (!existingBus) return res.status(404).json({ error: "Bus not found" });
        const updated = await Bus.findByIdAndUpdate(
            req.params.id,
            buildBusPayload({ ...existingBus.toObject(), ...req.body }),
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set route fees for all students on a bus
app.put('/api/buses/:id/route-fees', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { feeAmount } = req.body;
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) return res.status(404).json({ error: "Bus not found" });
        await Bus.findByIdAndUpdate(req.params.id, { feesPerTerm: feeAmount });
        const updatedStudents = await User.updateMany(
            { role: 'student', assignedBus: bus.busNo },
            { totalFees: feeAmount }
        );
        res.json({ message: "Route fees updated", updatedStudents: updatedStudents.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update student fees
app.put('/api/students/:id/fees', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { totalFees, paidFees, paymentStatus } = req.body;
    try {
        const normalizedTotalFees = toNumberOrDefault(totalFees, 0);
        const normalizedPaidFees = toNumberOrDefault(paidFees, 0);
        const computedStatus =
            paymentStatus ||
            (normalizedTotalFees > 0 && normalizedPaidFees >= normalizedTotalFees ? 'Paid' : 'Pending');
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { totalFees: normalizedTotalFees, paidFees: normalizedPaidFees, paymentStatus: computedStatus },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= DRIVER LOCATION =================
app.post('/api/driver/location', verifyToken, async (req, res) => {
    const { lat, lng } = req.body;
    const driverId = req.userId;

    if (req.userRole !== 'driver') return res.status(403).json({ error: "Only drivers can update location" });

    try {
        const newLocation = new DriverLocation({ driver_id: driverId, lat, lng });
        await newLocation.save();
        res.json({ message: "Location updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/driver/location/:driverId', verifyToken, async (req, res) => {
    const { driverId } = req.params;
    try {
        const location = await DriverLocation.findOne({ driver_id: driverId }).sort({ timestamp: -1 });
        res.json(location || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ================= STUDENTS / TEACHERS / DRIVERS =================
app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const students = await User.find(
            { role: 'student' },
            'name email role phone year department studentId parentContact bloodGroup address assignedBus totalFees paidFees paymentStatus'
        );
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        const teachers = await User.find(
            { role: 'teacher' },
            'name email role phone department employeeId designation cabinNo'
        );
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/drivers', verifyToken, async (req, res) => {
    try {
        const drivers = await User.find(
            { role: 'driver' },
            'name email role phone licenseNumber licenseNo experience bloodGroup joiningDate emergencyContact address assignedBusNo'
        );
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= FINANCE SUMMARY =================
app.get('/api/finance/summary', verifyToken, async (req, res) => {
    try {
        const [buses, students] = await Promise.all([
            Bus.find(),
            User.find({ role: 'student' }, 'name email phone parentContact assignedBus totalFees paidFees paymentStatus studentId')
        ]);

        const normalizedStudents = students.map((s) => {
            const totalFees = Number(s.totalFees || 0);
            const paidFees = Number(s.paidFees || 0);
            const due = Math.max(0, totalFees - paidFees);
            return {
                _id: s._id,
                id: s._id,
                name: s.name,
                email: s.email,
                phone: s.phone || '',
                parentContact: s.parentContact || '',
                assignedBus: s.assignedBus || '',
                totalFees,
                paidFees,
                due,
                studentId: s.studentId || '',
                paymentStatus: due <= 0 && totalFees > 0 ? 'Paid' : 'Pending'
            };
        });

        const totalRevenue = normalizedStudents.reduce((acc, s) => acc + s.paidFees, 0);
        const totalPending = normalizedStudents.reduce((acc, s) => acc + s.due, 0);
        const totalCapacity = buses.reduce((acc, b) => acc + Number(b.capacity || 0), 0);
        const filledSeats = normalizedStudents.filter((s) => s.assignedBus).length;

        const routes = buses.map((bus) => {
            const studentsOnBus = normalizedStudents.filter((s) => String(s.assignedBus || '') === String(bus.busNo || ''));
            const collected = studentsOnBus.reduce((acc, s) => acc + s.paidFees, 0);
            const pending = studentsOnBus.reduce((acc, s) => acc + s.due, 0);
            return {
                _id: bus._id,
                busNo: bus.busNo,
                route: bus.route || bus.busNo,
                feesPerTerm: Number(bus.feesPerTerm || 0),
                studentCount: studentsOnBus.length,
                collected,
                pending
            };
        });

        res.json({
            overall: {
                totalRevenue,
                totalPending,
                totalCapacity,
                filledSeats
            },
            routes,
            allStudents: normalizedStudents,
            unpaidStudents: normalizedStudents.filter((s) => s.due > 0)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= FEE REMINDERS =================
app.get('/api/fee-reminders', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const reminders = await FeeReminder.find({}).sort({ createdAt: -1 });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/fee-reminders', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { studentId, studentName, email, phone, parentContact, assignedBus, dueAmount, channel, subject, message } = req.body;
    if (!studentId || !studentName || !channel || !message) {
        return res.status(400).json({ error: "studentId, studentName, channel and message are required" });
    }
    if (!['whatsapp', 'gmail'].includes(channel)) {
        return res.status(400).json({ error: "Invalid reminder channel" });
    }
    try {
        const admin = await User.findById(req.userId).select('name');
        const reminder = new FeeReminder({
            studentId,
            studentName,
            email: email || '',
            phone: phone || '',
            parentContact: parentContact || '',
            assignedBus: assignedBus || '',
            dueAmount: toNumberOrDefault(dueAmount, 0),
            channel,
            subject: subject || '',
            message,
            createdBy: req.userId,
            createdByName: admin?.name || 'Admin'
        });
        await reminder.save();
        res.json(reminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/fee-reminders/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const deleted = await FeeReminder.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Reminder not found" });
        res.json({ message: "Reminder deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= LEAVE MANAGEMENT =================
app.post('/api/leaves', verifyToken, async (req, res) => {
    const { reason, fromDate, toDate, fromTime, toTime } = req.body;
    if (!reason || !fromDate || !toDate) {
        return res.status(400).json({ error: "reason, fromDate, toDate are required" });
    }
    if (!['student', 'teacher', 'driver'].includes(req.userRole)) {
        return res.status(403).json({ error: "Access denied" });
    }
    try {
        const user = await User.findById(req.userId).select('name role');
        const leave = new LeaveRequest({
            requesterId: req.userId,
            requesterName: user?.name || 'User',
            role: user?.role,
            reason,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            fromTime: fromTime || "",
            toTime: toTime || ""
        });
        await leave.save();
        res.json({ message: "Leave submitted", leave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leaves', verifyToken, async (req, res) => {
    try {
        const role = req.query.role;
        if (req.userRole === 'admin') {
            const filter = role ? { role } : {};
            const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 });
            return res.json(leaves);
        }
        if (req.userRole === 'teacher') {
            const leaves = await LeaveRequest.find({ role: 'student' }).sort({ createdAt: -1 });
            return res.json(leaves);
        }
        // student/driver -> own
        const leaves = await LeaveRequest.find({ requesterId: req.userId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/leaves/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });

        if (leave.role === 'student') {
            if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
                return res.status(403).json({ error: "Access denied" });
            }
        } else {
            if (req.userRole !== 'admin') {
                return res.status(403).json({ error: "Access denied" });
            }
        }

        leave.status = status;
        leave.approverId = req.userId;
        leave.approverRole = req.userRole;
        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate OTP (Teacher/Admin)
app.post('/api/attendance/otp/generate', verifyToken, async (req, res) => {
    if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
    }
    try {
        await AttendanceOTP.updateMany({ teacherId: req.userId, active: true }, { $set: { active: false } });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 20 * 1000); // 20 seconds
        const otp = new AttendanceOTP({
            code,
            teacherId: req.userId,
            expiresAt,
            active: true
        });
        await otp.save();
        res.json({ code, expiresAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP (Student)
app.post('/api/attendance/otp/verify', verifyToken, async (req, res) => {
    if (req.userRole !== 'student') {
        return res.status(403).json({ error: "Access denied" });
    }
    const { code } = req.body;
    if (!code || String(code).length !== 6) {
        return res.status(400).json({ error: "Invalid OTP" });
    }
    try {
        const now = new Date();
        const otp = await AttendanceOTP.findOne({ code: String(code), active: true, expiresAt: { $gt: now } }).sort({ expiresAt: -1 });
        if (!otp) return res.status(400).json({ error: "OTP expired or invalid" });

        const record = new Attendance({
            student_id: req.userId,
            status: "Present"
        });
        await record.save();

        otp.active = false;
        await otp.save();

        res.json({ message: "Attendance marked", id: record._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= DAMAGE REPORTS =================
app.post('/api/damages', verifyToken, async (req, res) => {
    if (req.userRole !== 'driver' && req.userRole !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
    }
    const { busNo, issueTitle, description, replacementRequired, images, amount, paymentMethod } = req.body;
    if (!busNo || !issueTitle || !description) {
        return res.status(400).json({ error: "busNo, issueTitle and description are required" });
    }
    try {
        const driver = await User.findById(req.userId).select('name');
        const report = new DamageReport({
            busNo,
            driverId: req.userId,
            driverName: driver?.name || "Driver",
            issueTitle,
            description,
            replacementRequired: replacementRequired || '',
            images: Array.isArray(images) ? images : [],
            amount: Number(amount) || 0,
            // Drivers shouldn't pick payment platform; admin updates it after reimbursement.
            paymentMethod: req.userRole === 'admin' ? (paymentMethod || '') : ''
        });
        await report.save();
        res.json({ message: "Damage report submitted", report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/damages', verifyToken, async (req, res) => {
    try {
        const filter = req.userRole === 'driver'
            ? { driverId: req.userId }
            : {};
        const reports = await DamageReport.find(filter).sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/damages/:id', verifyToken, async (req, res) => {
    try {
        const report = await DamageReport.findById(req.params.id);
        if (!report) return res.status(404).json({ error: "Report not found" });
        if (req.userRole === 'driver' && String(report.driverId) !== String(req.userId)) {
            return res.status(403).json({ error: "Access denied" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/damages/:id/status', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { status, adminNote } = req.body;
    try {
        const updated = await DamageReport.findByIdAndUpdate(
            req.params.id,
            { status, adminNote },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/damages/:id/payment', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { paymentStatus, paymentMethod, amount } = req.body;
    try {
        const report = await DamageReport.findById(req.params.id);
        if (!report) return res.status(404).json({ error: "Report not found" });
        report.paymentStatus = paymentStatus || report.paymentStatus;
        report.paymentMethod = paymentMethod || report.paymentMethod;
        if (amount !== undefined) report.amount = Number(amount) || 0;
        await report.save();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ANNOUNCEMENTS =================
app.get('/api/announcements', verifyToken, async (req, res) => {
    try {
        const announcements = await Announcement.find({}).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/announcements', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { title, message, category, targetAudience, priority, createdByName } = req.body;
    if (!title || !message) {
        return res.status(400).json({ error: "title and message are required" });
    }
    try {
        const admin = await User.findById(req.userId).select('name');
        const announcement = new Announcement({
            title: String(title).trim(),
            message: String(message).trim(),
            category,
            targetAudience,
            priority,
            createdById: req.userId,
            createdByName: createdByName || admin?.name || "Admin"
        });
        await announcement.save();
        res.json(announcement);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/announcements/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Announcement not found" });
        res.json({ message: "Announcement deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= WEATHER UPDATES =================
app.get('/api/weather', verifyToken, async (req, res) => {
    try {
        const latest = await WeatherUpdate.findOne({}).sort({ updatedAt: -1 });
        const liveWeather = await getRealWeatherSnapshot();

        res.json({
            condition: liveWeather.condition,
            note: latest?.note || liveWeather.note || 'No delay updates yet.',
            etaMinutes: Number(latest?.etaMinutes) || 0,
            updatedByName: latest?.updatedByName || 'System',
            updatedByRole: latest?.updatedByRole || 'system',
            updatedAt: latest?.updatedAt || liveWeather.updatedAt || new Date(),
            liveUpdatedAt: liveWeather.updatedAt,
            temperatureC: liveWeather.temperatureC,
            precipitationMm: liveWeather.precipitationMm,
            windSpeedKmh: liveWeather.windSpeedKmh,
            isDay: liveWeather.isDay,
            weatherCode: liveWeather.weatherCode,
            source: liveWeather.source,
            locationName: liveWeather.locationName
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/weather', verifyToken, async (req, res) => {
    if (req.userRole !== 'driver' && req.userRole !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
    }
    const { condition, note, etaMinutes, updatedByName } = req.body;
    try {
        const user = await User.findById(req.userId).select('name role');
        const liveWeather = await getRealWeatherSnapshot().catch(() => null);
        const update = new WeatherUpdate({
            condition: condition || liveWeather?.condition || 'Sunny',
            note: note || '',
            etaMinutes: Number(etaMinutes) || 0,
            updatedById: req.userId,
            updatedByName: updatedByName || user?.name || 'Driver',
            updatedByRole: user?.role || req.userRole || 'driver',
            updatedAt: new Date()
        });
        await update.save();
        res.json(update);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= FEEDBACK =================
app.post('/api/feedback', verifyToken, async (req, res) => {
    const { type, title, message } = req.body;
    if (!type || !title || !message) {
        return res.status(400).json({ error: 'type, title and message are required' });
    }
    if (!['good', 'bad', 'complaint', 'suggestion'].includes(type)) {
        return res.status(400).json({ error: 'Invalid feedback type' });
    }
    try {
        const user = await User.findById(req.userId).select('name role');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const feedback = new Feedback({
            userId: req.userId,
            userName: user.name || 'User',
            userRole: user.role,
            type,
            title,
            message
        });

        await feedback.save();
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/feedback/my', verifyToken, async (req, res) => {
    try {
        const rows = await Feedback.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/feedback', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const rows = await Feedback.find({}).sort({ createdAt: -1 });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/feedback/:id/reply', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const { id } = req.params;
    const { adminReply, status } = req.body;
    if (!adminReply || !String(adminReply).trim()) {
        return res.status(400).json({ error: 'Reply is required' });
    }
    if (status && !['open', 'reviewed', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const feedback = await Feedback.findById(id);
        if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

        feedback.adminReply = String(adminReply).trim();
        feedback.status = status || 'reviewed';
        feedback.repliedBy = req.userId;
        feedback.repliedAt = new Date();
        await feedback.save();

        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ANALYTICS =================
app.get('/api/analytics', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        const [students, teachers, drivers, buses] = await Promise.all([
            User.find({ role: 'student' }),
            User.find({ role: 'teacher' }),
            User.find({ role: 'driver' }),
            Bus.find()
        ]);

        const totalRevenue = students.reduce((acc, s) => acc + (s.paidFees || 0), 0);
        const totalExpected = students.reduce((acc, s) => acc + (s.totalFees || 0), 0);
        const totalPending = Math.max(0, totalExpected - totalRevenue);

        const paymentCounts = students.reduce((acc, s) => {
            const totalFees = s.totalFees || 0;
            const paidFees = s.paidFees || 0;
            if (paidFees >= totalFees && totalFees > 0) acc.paid += 1;
            else if (paidFees > 0 && paidFees < totalFees) acc.partial += 1;
            else acc.unpaid += 1;
            return acc;
        }, { paid: 0, partial: 0, unpaid: 0 });

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const attendanceAgg = await Attendance.aggregate([
            {
                $addFields: {
                    safeDate: {
                        $convert: {
                            input: "$date",
                            to: "date",
                            onError: null,
                            onNull: null
                        }
                    }
                }
            },
            { $match: { safeDate: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$safeDate" },
                        month: { $month: "$safeDate" },
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const computedMonthly = buildDefaultMonthlyAttendance().map((m) => ({ ...m }));
        const monthIndex = new Map(computedMonthly.map((m, idx) => [m.monthKey, idx]));
        attendanceAgg.forEach((row) => {
            const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
            const idx = monthIndex.get(key);
            if (idx === undefined) return;
            const status = String(row._id.status || "").toLowerCase();
            if (status === "present") computedMonthly[idx].present += row.count;
            else if (status === "absent") computedMonthly[idx].absent += row.count;
        });

        const store = loadAnalyticsStore();
        const monthlyAttendance = mergeMonthlyAttendance(computedMonthly, store.monthlyAttendance);

        const busUtilization = buses.map((b) => {
            const capacity = b.capacity || 0;
            const filled = b.filledSeats || 0;
            const utilization = capacity > 0 ? Math.round((filled / capacity) * 100) : 0;
            return { busNo: b.busNo, capacity, filled, utilization };
        });

        const leaveCounts = await LeaveRequest.aggregate([
            { $group: { _id: { role: "$role", status: "$status" }, count: { $sum: 1 } } }
        ]);
        const init = { total: 0, pending: 0, approved: 0, rejected: 0 };
        const leaveStats = {
            studentLeaves: { ...init },
            teacherLeaves: { ...init },
            driverLeaves: { ...init }
        };
        leaveCounts.forEach((row) => {
            const role = row._id.role;
            const status = row._id.status;
            const key = role === 'student' ? 'studentLeaves' : role === 'teacher' ? 'teacherLeaves' : 'driverLeaves';
            leaveStats[key].total += row.count;
            leaveStats[key][status] = row.count;
        });

        res.json({
            overview: {
                totalStudents: students.length,
                totalTeachers: teachers.length,
                totalDrivers: drivers.length,
                totalBuses: buses.length
            },
            monthlyAttendance,
            busUtilization,
            revenue: { totalRevenue, totalPending, totalExpected },
            paymentDistribution: paymentCounts,
            leaveStats,
            driverPerformance: drivers.map((d) => ({ name: d.name, experience: d.experience || "N/A", score: Math.floor(70 + Math.random() * 30) })),
            routeEfficiency: buses.map((b) => ({ busNo: b.busNo, load: Math.round((b.filledSeats || 0) / (b.capacity || 1) * 100) })),
            weatherInsights: {
                temp: "30°C",
                condition: "Clear",
                prediction: "No delays expected for major routes today.",
                trafficStatus: "Normal",
                activeAlerts: []
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/analytics/monthly', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Access denied" });
    const { monthKey, present, absent } = req.body;
    if (!monthKey) return res.status(400).json({ error: "monthKey is required" });

    try {
        const store = loadAnalyticsStore();
        const monthly = Array.isArray(store.monthlyAttendance) ? store.monthlyAttendance : [];
        const monthDate = new Date(`${monthKey}-01T00:00:00`);
        const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' });

        const idx = monthly.findIndex((m) => m.monthKey === monthKey);
        const entry = { month: monthLabel, monthKey, present: Number(present) || 0, absent: Number(absent) || 0 };
        if (idx >= 0) monthly[idx] = entry;
        else monthly.push(entry);

        store.monthlyAttendance = monthly;
        saveAnalyticsStore(store);
        res.json({ message: "Monthly stats updated", entry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
