const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../services/EmailService');

const router = express.Router();
const prisma = new PrismaClient();

// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                otp,
                otpExpires
            }
        });

        await sendEmail(email, 'Verify your account', `Your OTP is ${otp}`);

        res.status(201).json({ message: 'User created. Check email for OTP.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await prisma.user.update({
            where: { email },
            data: { isVerified: true, otp: null, otpExpires: null }
        });

        // ... existing verify-otp logic ...
        res.json({ message: 'Account verified successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.user.update({
            where: { email },
            data: { otp, otpExpires }
        });

        await sendEmail(email, 'Reset Password OTP', `Your OTP for password reset is ${otp}`);

        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpires: null
            }
        });

        res.json({ message: 'Password reset successful. Please login.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
