import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Terms of Service - Rizzify',
  description: 'Rizzify Terms of Service - Read our terms and conditions',
}

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none text-light/80">
            <p className="text-sm text-light/60 mb-8">Last updated: October 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing and using Rizzify ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on Rizzify for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on Rizzify</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                <li>Use automated tools to access the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Disclaimer</h2>
              <p>
                The materials on Rizzify are provided on an 'as is' basis. Rizzify makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Limitations</h2>
              <p>
                In no event shall Rizzify or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Rizzify, even if Rizzify or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on Rizzify could include technical, typographical, or photographic errors. Rizzify does not warrant that any of the materials on its website are accurate, complete, or current. Rizzify may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Materials and Content</h2>
              <p>
                The materials on Rizzify are protected by copyright law and international treaties. You may not reproduce, distribute, transmit, display, or perform any content on this website without permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. User Accounts</h2>
              <p>
                When you create an account with Rizzify, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the confidentiality of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Photo Upload and Usage</h2>
              <p>
                By uploading photos to Rizzify, you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Warrant that you own or have permission to use the photos</li>
                <li>Grant Rizzify a license to process and store your photos for service delivery</li>
                <li>Understand that photos may be deleted after a specified period</li>
                <li>Accept that generated photos are for personal use only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Generated Content</h2>
              <p>
                Generated photos created by Rizzify:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Are provided for personal, non-commercial use only</li>
                <li>May not be used for commercial purposes without explicit permission</li>
                <li>Remain subject to our intellectual property rights</li>
                <li>May be subject to expiration and deletion (see plan details)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Pricing and Payments</h2>
              <p>
                Rizzify offers different pricing plans. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pay all fees according to the plan you select</li>
                <li>Provide valid payment information</li>
                <li>Accept that prices may change with notice</li>
                <li>Understand refund policies as stated in your plan</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Free Plan Limitations</h2>
              <p>
                The Free plan includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>One generation per day (2 photos)</li>
                <li>Watermarked photos</li>
                <li>24-hour expiration on generated photos</li>
                <li>Limited support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Service Delivery and Timeframes</h2>
              <p>
                We strive to deliver generated photos in a timely manner. Typical generation times are:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free Plan:</strong> Usually 2 minutes, depending on queue</li>
                <li><strong>Start Plan:</strong> Usually 10-15 minutes, depending on queue</li>
                <li><strong>Pro Plan:</strong> Usually 10-15 minutes, depending on queue</li>
              </ul>
              <p className="mt-4">
                <strong>Important Notes:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generation times may vary based on server load, network conditions, and queue length</li>
                <li>These are estimated timeframes and not guarantees</li>
                <li>We do not guarantee specific delivery times</li>
                <li>Delays due to high demand or technical issues do not constitute grounds for refund unless generation fails completely</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">13. NSFW Content Prohibition</h2>
              <p>
                Rizzify strictly prohibits NSFW (Not Safe For Work) content. You agree not to upload:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nudity or sexually explicit content</li>
                <li>Violence or graphic imagery</li>
                <li>Hate speech or discriminatory content</li>
                <li>Any content that violates applicable laws or our policies</li>
              </ul>
              <p className="mt-4">
                <strong>Automated Detection:</strong> Our AI models include built-in safety filters that automatically detect and reject NSFW content.
              </p>
              <p className="mt-4">
                <strong>Consequences of Violation:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Immediate rejection of uploaded content</li>
                <li>No refund for rejected content</li>
                <li>Account suspension or termination for repeated violations</li>
                <li>Reporting of illegal content to authorities as required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">14. Prohibited Conduct</h2>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload photos of people without their consent</li>
                <li>Upload NSFW or inappropriate content</li>
                <li>Use the service for illegal purposes</li>
                <li>Harass, abuse, or harm others</li>
                <li>Attempt to gain unauthorized access to the service</li>
                <li>Use the service to create misleading or fraudulent content</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">15. Termination</h2>
              <p>
                Rizzify may terminate or suspend your account and access to the service immediately, without prior notice or liability, if you breach any terms of this agreement or engage in prohibited conduct.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">16. Limitation of Liability</h2>
              <p>
                In no event shall Rizzify, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">17. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Rizzify from any claims, damages, losses, or expenses arising from your use of the service or violation of these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">18. Modifications to Service</h2>
              <p>
                Rizzify reserves the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">19. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms of Service are governed by and construed in accordance with the laws of the United States of America, without regard to its conflict of law provisions.
              </p>
              <p className="mt-4">
                <strong>Dispute Resolution:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any disputes arising from or relating to these terms or your use of the service shall be resolved through good faith negotiations</li>
                <li>If negotiations fail, disputes shall be resolved in the courts of competent jurisdiction in the United States</li>
                <li>You agree to submit to the personal jurisdiction of such courts</li>
                <li>Each party shall bear its own costs and attorneys' fees unless otherwise awarded by the court</li>
              </ul>
              <p className="mt-4">
                <strong>Refund Disputes:</strong> For refund-related disputes, please refer to our <a href="/refund" className="text-blue-400 hover:text-blue-300 underline">Refund Policy</a> and contact us at le13107621169@gmail.com before pursuing legal action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">20. Severability</h2>
              <p>
                If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">21. Entire Agreement</h2>
              <p>
                These terms and conditions constitute the entire agreement between you and Rizzify regarding the use of the service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">22. Contact Us</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-2">
                <p><strong>Email:</strong> le13107621169@gmail.com</p>
                <p><strong>Location:</strong> Nanjing, China</p>
                <p><strong>Feedback:</strong> <a href="/feedback" className="text-blue-400 hover:text-blue-300 underline">Submit Feedback</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
