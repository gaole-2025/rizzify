import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Refund Policy - Rizzify',
  description: 'Rizzify Refund Policy - Learn about our refund terms and conditions',
}

export default function RefundPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold text-white mb-8">Refund Policy</h1>
          
          <div className="prose prose-invert max-w-none text-light/80">
            <p className="text-sm text-light/60 mb-8">Last updated: October 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Overview</h2>
              <p>
                At Rizzify, we strive to provide high-quality AI-generated dating photos. This Refund Policy outlines the conditions under which refunds may be requested and processed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Refund Eligibility by Plan</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.1 Free Plan</h3>
              <p>
                The Free plan does not involve any payment and is therefore not eligible for refunds.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.2 Start Plan ($9.99) and Pro Plan ($19.99)</h3>
              <p>
                Paid plans (Start and Pro) are eligible for refunds under the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Time limit:</strong> Refund requests must be submitted within 7 days of purchase</li>
                <li><strong>Reason:</strong> You must provide a valid reason for dissatisfaction</li>
                <li><strong>Review process:</strong> All refund requests are subject to review and approval</li>
                <li><strong>Service fee deduction:</strong> Approved refunds will be subject to a service fee deduction of approximately 30% to cover third-party API costs and processing fees</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Non-Refundable Situations</h2>
              <p>
                Refunds will NOT be granted in the following cases:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Requests made after the 7-day refund window</li>
                <li>Photos have been successfully generated and delivered as promised</li>
                <li>User uploaded inappropriate, low-quality, or non-compliant photos</li>
                <li>User violated our Terms of Service or uploaded NSFW content</li>
                <li>Technical issues on the user's side (e.g., incorrect email, lost access to account)</li>
                <li>Change of mind after successful delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. How to Request a Refund</h2>
              <p>
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Visit our <a href="/feedback" className="text-blue-400 hover:text-blue-300 underline">Feedback page</a> or email us at <a href="mailto:le13107621169@gmail.com" className="text-blue-400 hover:text-blue-300 underline">le13107621169@gmail.com</a></li>
                <li>Include your order number, email address, and reason for the refund request</li>
                <li>Provide any relevant details or screenshots to support your claim</li>
                <li>Our team will review your request within 2-3 business days</li>
                <li>You will receive an email notification regarding the approval or denial of your request</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Refund Processing Time</h2>
              <p>
                Once your refund request is approved:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Refunds will be processed within 5-10 business days</li>
                <li>The refund will be issued to the original payment method</li>
                <li>Depending on your bank or payment provider, it may take an additional 3-5 business days for the refund to appear in your account</li>
                <li>You will receive a confirmation email once the refund has been processed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Service Fee Deduction</h2>
              <p>
                Please note that approved refunds are subject to a service fee deduction of approximately 30%. This fee covers:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Third-party AI API costs incurred during photo generation</li>
                <li>Payment processing fees</li>
                <li>Infrastructure and operational costs</li>
              </ul>
              <p className="mt-4">
                <strong>Example:</strong> If you purchased the Start plan for $9.99 and your refund is approved, you will receive approximately $6.99 after the 30% service fee deduction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Partial Refunds</h2>
              <p>
                In certain cases, we may offer partial refunds at our discretion:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If only a portion of the service was delivered</li>
                <li>If there were technical issues that affected the quality of some (but not all) generated photos</li>
                <li>If the generation time significantly exceeded the estimated timeframe due to our system issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Chargebacks</h2>
              <p>
                If you initiate a chargeback with your bank or payment provider without first contacting us:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your account may be suspended or terminated</li>
                <li>You may be banned from using our services in the future</li>
                <li>We reserve the right to dispute illegitimate chargebacks</li>
              </ul>
              <p className="mt-4">
                We encourage you to contact us first to resolve any issues before initiating a chargeback.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
              <p>
                We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting on this page. Your continued use of our services after any changes constitutes acceptance of the new policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
              <p>
                If you have questions about this Refund Policy or need to request a refund, please contact us:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-2">
                <p><strong>Email:</strong> <a href="mailto:le13107621169@gmail.com" className="text-blue-400 hover:text-blue-300">le13107621169@gmail.com</a></p>
                <p><strong>Feedback Form:</strong> <a href="/feedback" className="text-blue-400 hover:text-blue-300">Submit Feedback</a></p>
                <p><strong>Response Time:</strong> Within 2-3 business days</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
