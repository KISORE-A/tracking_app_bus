const mongoose = require('mongoose');

const FeeReminderSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        studentName: { type: String, required: true },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        parentContact: { type: String, default: '' },
        assignedBus: { type: String, default: '' },
        dueAmount: { type: Number, default: 0 },
        channel: { type: String, enum: ['whatsapp', 'gmail'], required: true },
        subject: { type: String, default: '' },
        message: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdByName: { type: String, default: 'Admin' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('FeeReminder', FeeReminderSchema);
