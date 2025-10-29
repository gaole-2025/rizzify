'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function ContactPage() {
  const searchParams = useSearchParams()
  const subjectParam = searchParams?.get('subject')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: subjectParam === 'refund' ? 'Refund Request' : '',
    orderNumber: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isRefundRequest, setIsRefundRequest] = useState(subjectParam === 'refund')

  useEffect(() => {
    if (subjectParam === 'refund') {
      setIsRefundRequest(true)
      setFormData(prev => ({ ...prev, subject: 'Refund Request' }))
    }
  }, [subjectParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // 这里应该调用你的 API 发送邮件
      // 暂时模拟提交
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: 实际实现时，调用 API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })
      
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        subject: isRefundRequest ? 'Refund Request' : '',
        orderNumber: '',
        message: '',
      })
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'subject') {
      setIsRefundRequest(value === 'Refund Request')
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-light/70 mb-8">
            {isRefundRequest 
              ? 'Please fill out the form below to request a refund. We will review your request within 2-3 business days.'
              : 'Have a question or need help? Send us a message and we\'ll get back to you as soon as possible.'
            }
          </p>

          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
              <p className="font-semibold mb-1">Message sent successfully!</p>
              <p className="text-sm">We'll get back to you within 2-3 business days.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <p className="font-semibold mb-1">Failed to send message</p>
              <p className="text-sm">Please try again or email us directly at support@rizzify.com</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-light mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-light mb-2">
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a subject</option>
                <option value="Refund Request">Refund Request</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Billing Question">Billing Question</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Order Number (for refund requests) */}
            {isRefundRequest && (
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-light mb-2">
                  Order Number *
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  required={isRefundRequest}
                  value={formData.orderNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your order/transaction ID"
                />
                <p className="mt-2 text-xs text-light/60">
                  You can find your order number in your confirmation email or account dashboard.
                </p>
              </div>
            )}

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-light mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={isRefundRequest 
                  ? "Please explain why you're requesting a refund and provide any relevant details..."
                  : "Tell us how we can help you..."
                }
              />
              {isRefundRequest && (
                <p className="mt-2 text-xs text-light/60">
                  Note: Refunds are subject to our <a href="/refund" className="text-blue-400 hover:text-blue-300 underline">Refund Policy</a>. A 30% service fee will be deducted from approved refunds. You can also email us directly at le13107621169@gmail.com
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          {/* Alternative Contact */}
          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Other Ways to Reach Us</h2>
            <div className="space-y-3 text-light/70">
              <div>
                <span className="font-medium text-white">Email:</span>{' '}
                <a href="mailto:le13107621169@gmail.com" className="text-blue-400 hover:text-blue-300">
                  le13107621169@gmail.com
                </a>
              </div>
              <div>
                <span className="font-medium text-white">Response Time:</span> Within 2-3 business days
              </div>
              <div>
                <span className="font-medium text-white">Location:</span> Nanjing, China
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
