import { useState, useEffect } from 'react'

function WhatsAppService() {
    const [status, setStatus] = useState('initializing')
    const [qrCode, setQrCode] = useState('')
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        let interval
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/status')
                const data = await res.json()
                setStatus(data.status)
                if (data.qr) setQrCode(data.qr)

                if (data.status === 'ready') {
                    clearInterval(interval)
                }
            } catch (err) {
                console.error('Error fetching status:', err)
            }
        }

        checkStatus()
        interval = setInterval(checkStatus, 2000)
        return () => clearInterval(interval)
    }, [])

    const handleSend = async () => {
        if (!phone || !message) {
            setToast({ text: 'يرجى إدخال الرقم والرسالة أولاً ⚠️', type: 'error' })
            setTimeout(() => setToast(null), 3000)
            return
        }

        setIsSending(true)
        setToast({ text: 'جاري الإرسال... ⏳', type: 'info' })

        try {
            const res = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, message })
            })
            const data = await res.json()

            if (data.success) {
                setToast({ text: 'تم إرسال الرسالة بنجاح ✅', type: 'success' })
                setMessage('')
            } else {
                setToast({ text: 'حدث خطأ: ' + data.error, type: 'error' })
            }
        } catch (err) {
            setToast({ text: 'فشل الاتصال بالسيرفر ❌', type: 'error' })
        } finally {
            setIsSending(false)
            setTimeout(() => setToast(null), 4000)
        }
    }

    const renderContent = () => {
        if (status === 'initializing' || status === 'disconnected') {
            return (
                <div className="glass-panel">
                    <div className="loader"></div>
                    <h1>تهيئة نظام الواتساب</h1>
                    <p>جاري الاتصال بخوادم واتساب... يرجى الانتظار ثوانٍ معدودة.</p>
                </div>
            )
        }

        if (status === 'needs_scan') {
            return (
                <div className="glass-panel">
                    <h1>ربط واتساب بالبرنامج</h1>
                    <p>قم بفتح تطبيق الواتساب على هاتفك، اذهب إلى الأجهزة المرتبطة، وصور الكود التالي:</p>
                    <div className="qr-wrapper">
                        <img src={qrCode} alt="QR Code" />
                    </div>
                </div>
            )
        }

        if (status === 'ready') {
            return (
                <div className="glass-panel" style={{ textAlign: 'center' }}>
                    <h1>مركز اتصال الواتساب 💬</h1>
                    <p>تم الربط بنجاح! السيرفر جاهز الآن لإرسال الفواتير والرسائل مباشرة.</p>

                    <div style={{ marginTop: '30px' }}>
                        <div className="form-group">
                            <label>رقم هاتف العميل (اختياري بكود الدولة)</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="مثال: 01012345678"
                            />
                        </div>

                        <div className="form-group">
                            <label>محتوى الرسالة</label>
                            <textarea
                                rows="4"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="اكتب العرض، الترحيب، أو الرسالة هنا..."
                            />
                        </div>

                        <button onClick={handleSend} disabled={isSending}>
                            {isSending ? 'جاري الإرسال ⏳...' : 'إرسال الرسالة الآن 🚀'}
                        </button>

                        {toast && (
                            <div className="status-msg" style={{
                                backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: toast.type === 'error' ? 'var(--danger)' : 'var(--primary)'
                            }}>
                                {toast.text}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return null
    }

    return renderContent()
}

function App() {
    return <WhatsAppService />
}

export default App
