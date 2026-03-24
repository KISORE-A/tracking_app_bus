const mongoose = require('mongoose');

const StudentFeeDocumentSchema = new mongoose.Schema({
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    data: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'driver', 'admin', 'teacher'], default: 'student' },
    phone: { type: String },
    parentContact: { type: String },
    department: { type: String },
    year: { type: String },
    studentId: { type: String },
    employeeId: { type: String },
    designation: { type: String },
    cabinNo: { type: String },
    bloodGroup: { type: String },
    address: { type: String },
    assignedBus: { type: String },
    totalFees: { type: Number, default: 0 },
    paidFees: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    feeHistoryTitle: { type: String, default: '' },
    feeHistoryNote: { type: String, default: '' },
    feeHistoryUpdatedAt: { type: Date },
    feeTemplateFields: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    feeDocuments: {
        pdf: { type: StudentFeeDocumentSchema, default: () => ({}) },
        docx: { type: StudentFeeDocumentSchema, default: () => ({}) }
    },
    // Driver-only profile fields
    licenseNumber: { type: String },
    licenseNo: { type: String },
    licenseCardImage: { type: String }, // data URL or hosted URL
    experience: { type: String },
    joiningDate: { type: Date },
    emergencyContact: { type: String },
    assignedBusNo: { type: String }, // optional fallback if bus.driverId isn't set
    isTwoFactorEnabled: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', UserSchema);
