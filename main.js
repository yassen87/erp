const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

let whatsappClient;

// إعداد خادم API (Express)
const apiApp = express();
apiApp.use(cors());
apiApp.use(express.json({ limit: '50mb' }));
apiApp.use(express.urlencoded({ limit: '50mb', extended: true }));

apiApp.post('/api/send-message', async (req, res) => {
    const { phone, message, pdfBase64, htmlContent } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }
    
    try {
        let formattedPhone = phone.replace(/\D/g, ''); 
        if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
            formattedPhone = '2' + formattedPhone;
        }
        const chatId = formattedPhone.includes('@c.us') ? formattedPhone : `${formattedPhone}@c.us`;
        
        if (!whatsappClient) {
            return res.status(500).json({ success: false, error: 'WhatsApp client is not initialized' });
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
    console.log('API Server running on port 3000');
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

whatsappClient.on('qr', (qr) => {
    console.log('\n\n===========================================');
    console.log('يرجى عمل مسح (Scan) لهذا الكود باستخدام تطبيق واتساب');
    console.log('===========================================\n');
    qrcodeTerminal.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Client is READY! 🚀');
});

whatsappClient.on('authenticated', () => {
    console.log('WhatsApp Authenticated successfully.');
});

whatsappClient.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure:', msg);
});

whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected:', reason);
    whatsappClient.initialize();
});

// تشغيل العميل
console.log('Starting WhatsApp Client...');
whatsappClient.initialize();
