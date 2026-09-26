const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

let whatsappClient;
let currentQR = '';
let currentStatus = 'initializing';

// إعداد خادم API (Express)
const apiApp = express();
apiApp.use(cors());
apiApp.use(express.json({ limit: '50mb' }));
apiApp.use(express.urlencoded({ limit: '50mb', extended: true }));

// خدمة ملف الواجهة
apiApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار للحصول على حالة الواتساب
apiApp.get('/api/status', (req, res) => {
    res.json({ status: currentStatus, qr: currentQR });
});

apiApp.post('/api/send-message', async (req, res) => {
    const { phone, message, pdfBase64 } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }
    
    try {
        let formattedPhone = phone.replace(/\D/g, ''); 
        if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
            formattedPhone = '2' + formattedPhone;
        }
        const chatId = formattedPhone.includes('@c.us') ? formattedPhone : `${formattedPhone}@c.us`;
        
        if (!whatsappClient || currentStatus !== 'ready') {
            return res.status(500).json({ success: false, error: 'WhatsApp is not ready' });
        }

        let media = null;
        if (pdfBase64) {
            media = new MessageMedia('application/pdf', pdfBase64, 'Invoice.pdf');
        }

        if (media) {
            await whatsappClient.sendMessage(chatId, media, { caption: message });
        } else {
            await whatsappClient.sendMessage(chatId, message);
        }

        return res.json({ success: true, message: 'Sent successfully' });
    } catch (err) {
        console.error('API Send Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

apiApp.listen(3000, () => {
    console.log('WhatsApp Web Service running on port 3000');
});

// تهيئة WhatsApp Client
whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

whatsappClient.on('qr', async (qr) => {
    console.log('QR Code generated. Please scan it from the Web UI.');
    currentStatus = 'needs_scan';
    currentQR = await qrcode.toDataURL(qr);
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Client is READY! 🚀');
    currentStatus = 'ready';
    currentQR = '';
});

whatsappClient.on('authenticated', () => {
    console.log('WhatsApp Authenticated successfully.');
});

whatsappClient.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure:', msg);
    currentStatus = 'error';
});

whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected:', reason);
    currentStatus = 'disconnected';
    whatsappClient.initialize();
});

// تشغيل العميل
console.log('Starting WhatsApp Client...');
whatsappClient.initialize();
